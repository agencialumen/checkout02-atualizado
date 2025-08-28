"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, ArrowLeft, Loader2 } from "lucide-react"
import Image from "next/image"
import { checkPaymentStatus } from "@/app/actions/check-payment"

interface PixPaymentProps {
  pixPayload: string
  transactionId: string
  totalAmount: number
  onPaymentConfirmed: () => void
  onGoBack?: () => void
}

export function PixPayment({ pixPayload, transactionId, totalAmount, onPaymentConfirmed, onGoBack }: PixPaymentProps) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(true)
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date())

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Verificação de pagamento a cada 5 segundos
  useEffect(() => {
    let paymentCheckInterval: NodeJS.Timeout

    const checkPayment = async () => {
      try {
        setLastCheckTime(new Date())
        const result = await checkPaymentStatus(transactionId)

        if (result.success && result.status === "AUTHORIZED") {
          // Pagamento aprovado!
          setIsCheckingPayment(false)
          handlePaymentConfirmed()
        } else if (result.success) {
          console.log(`Status do pagamento: ${result.status}`)
        } else {
          console.error("Erro ao verificar pagamento:", result.error)
        }
      } catch (error) {
        console.error("Erro na verificação:", error)
      }
    }

    // Primeira verificação imediata
    checkPayment()

    // Verificação a cada 5 segundos
    paymentCheckInterval = setInterval(checkPayment, 5000)

    return () => {
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval)
      }
    }
  }, [transactionId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const generateQRCodeUrl = (payload: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`
  }

  const handlePaymentConfirmed = () => {
    setShowSuccessMessage(true)

    // Disparar evento Purchase
    onPaymentConfirmed()

    // Redirecionar automaticamente após 3 segundos
    setTimeout(() => {
      window.location.href = "https://ultimaschances.netlify.app/obrigado"
    }, 3000)
  }

  // Se mostrando mensagem de sucesso
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Pagamento Aprovado!</h2>
            <p className="text-gray-600 mb-4">
              Seu pagamento foi confirmado com sucesso. Você receberá um e-mail com os detalhes.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Redirecionando para página de confirmação...</p>
              <div className="flex items-center justify-center mt-2">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-xs">Aguarde...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#f2f2f2] border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-4">
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
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center p-4 pt-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600 mb-2">Pagamento PIX</CardTitle>
            <p className="text-sm text-gray-600">Escaneie o QR Code ou copie o código PIX abaixo</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Status */}
            <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                {isCheckingPayment ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : (
                  <Check className="w-5 h-5 text-green-600" />
                )}
                <span className="font-medium text-blue-800">
                  {isCheckingPayment ? "Aguardando pagamento..." : "Pagamento confirmado!"}
                </span>
              </div>
              <p className="text-xs text-blue-700">
                {isCheckingPayment
                  ? `Última verificação: ${lastCheckTime.toLocaleTimeString()}`
                  : "Processando confirmação..."}
              </p>
            </div>

            {/* Timer */}
            <div className="text-center bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600 mb-1">{formatTime(timeLeft)}</div>
              <p className="text-sm text-red-700 font-medium">Tempo restante para pagamento</p>
            </div>

            {/* Amount */}
            <div className="text-center bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Valor a pagar:</p>
              <div className="text-4xl font-bold text-green-600">R$ {totalAmount.toFixed(2).replace(".", ",")}</div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-lg">
                <Image
                  src={generateQRCodeUrl(pixPayload) || "/placeholder.svg"}
                  alt="QR Code PIX"
                  width={300}
                  height={300}
                  className="w-72 h-72"
                />
              </div>
            </div>

            {/* PIX Code */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 block text-center">Ou copie o código PIX:</label>
              <div className="flex gap-2">
                <div className="flex-1 p-4 bg-gray-100 rounded-lg text-sm font-mono break-all border">{pixPayload}</div>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-auto px-4 py-4 bg-transparent"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 text-center">Como pagar:</h4>
              <ol className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Abra o app do seu banco ou carteira digital</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Escolha a opção "PIX" ou "Pagar com PIX"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Escaneie o QR Code ou cole o código copiado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <span>Confirme o pagamento no seu app</span>
                </li>
              </ol>
            </div>

            {/* Auto verification message */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                <p className="text-sm text-yellow-800 text-center font-medium">
                  Verificando pagamento automaticamente a cada 5 segundos
                </p>
              </div>
              <p className="text-xs text-yellow-700 text-center mt-1">
                Assim que o pagamento for aprovado, você será redirecionado automaticamente
              </p>
            </div>

            {/* Transaction ID */}
            <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">ID da Transação:</p>
              <p className="font-mono">{transactionId}</p>
            </div>

            {/* Back Button Only */}
            {onGoBack && (
              <Button onClick={onGoBack} variant="outline" className="w-full h-12 text-base bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Checkout
              </Button>
            )}

            {/* Security Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Pagamento Seguro</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Criptografado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>PIX Oficial</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
