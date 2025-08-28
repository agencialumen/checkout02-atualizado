"use server"

import { createTransaction } from "@/lib/lirapay"
import { headers } from "next/headers"

interface OrderBump {
  id: number
  title: string
  description: string
  price: string
}

interface PaymentData {
  // Customer data
  email: string
  phone: string
  fullName: string
  cpf: string

  // Address data
  cep: string
  address: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  country: string

  // Order data
  selectedShipping: string
  selectedBumps: number[]
}

const getShippingPrice = (shippingType: string) => {
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

const getShippingTitle = (shippingType: string) => {
  switch (shippingType) {
    case "full":
      return "Frete Full (Receba em Até 24hrs)"
    case "sedex":
      return "Correios (SEDEX)"
    case "pac":
      return "Correios (PAC)"
    default:
      return "Frete"
  }
}

const orderBumps: OrderBump[] = [
  {
    id: 1,
    title: "12 pacotes extra de lenços",
    description: "48uni em cada pacote (Receba tudo no mesmo frete)",
    price: "R$25,08",
  },
  {
    id: 2,
    title: "Shampoo Sabonete Condicionador",
    description: "Kit completo de higiene para seu bebê",
    price: "R$16,17",
  },
  {
    id: 3,
    title: "Kit Higiene Cuidados Saúde Bebê",
    description: "Tudo que você precisa para cuidar da saúde do seu bebê com Zeep",
    price: "R$19,00",
  },
]

const getOrderBumpPrice = (bumpId: number) => {
  const bump = orderBumps.find((b) => b.id === bumpId)
  if (!bump) return 0
  return Number.parseFloat(bump.price.replace("R$", "").replace(",", "."))
}

// Função para capturar parâmetros UTM do cliente
const getUTMParamsFromClient = () => {
  // Esta função será chamada do lado do cliente
  // Os parâmetros UTM serão passados via localStorage ou cookies
  return {}
}

export async function processPayment(data: PaymentData) {
  try {
    // Get client IP
    const headersList = headers()
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : headersList.get("x-real-ip") || "127.0.0.1"

    // Calculate total amount
    const shippingCost = getShippingPrice(data.selectedShipping)
    const orderBumpsCost = data.selectedBumps.reduce((total, bumpId) => {
      return total + getOrderBumpPrice(bumpId)
    }, 0)

    // Total amount is shipping + order bumps (product is free)
    const totalAmount = shippingCost + orderBumpsCost

    // Build items array
    const items = []

    // Add main product (Kit Pampers Premium) - produto gratuito, apenas frete
    items.push({
      id: "kit-pampers-premium",
      title: "Kit Pampers Premium - Produto Gratuito",
      description: "9 Pacotes de Fraldas + 6 Pacotes de Lenços (Apenas pague o frete)",
      price: 0.01, // Valor mínimo para a API aceitar
      quantity: 1,
      is_physical: true,
    })

    // Add shipping as an item
    if (data.selectedShipping && shippingCost > 0) {
      items.push({
        id: `shipping-${data.selectedShipping}`,
        title: getShippingTitle(data.selectedShipping),
        description: "Frete para entrega do produto",
        price: shippingCost - 0.01, // Subtrair o valor mínimo já adicionado no produto
        quantity: 1,
        is_physical: false,
      })
    }

    // Add order bumps
    data.selectedBumps.forEach((bumpId) => {
      const bump = orderBumps.find((b) => b.id === bumpId)
      if (bump) {
        const bumpPrice = getOrderBumpPrice(bumpId)
        if (bumpPrice > 0) {
          items.push({
            id: `order-bump-${bumpId}`,
            title: bump.title,
            description: bump.description,
            price: bumpPrice,
            quantity: 1,
            is_physical: true,
          })
        }
      }
    })

    // Generate external ID
    const externalId = `pampers-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create transaction with LiraPay
    const transaction = await createTransaction({
      external_id: externalId,
      total_amount: totalAmount,
      payment_method: "PIX",
      webhook_url: "https://webhook-test.com/pampers-checkout", // URL válida para webhook
      items,
      ip,
      customer: {
        name: data.fullName,
        email: data.email,
        phone: data.phone.replace(/\D/g, ""), // Remove formatting
        document_type: "CPF",
        document: data.cpf.replace(/\D/g, ""), // Remove formatting
        // Adicionar parâmetros UTM se disponíveis
        utm_source: undefined, // Será preenchido pelo cliente
        utm_medium: undefined,
        utm_campaign: undefined,
        utm_content: undefined,
        utm_term: undefined,
      },
    })

    return {
      success: true,
      transaction,
      pixPayload: transaction.pix?.payload,
      transactionId: transaction.id,
      externalId,
      totalAmount,
    }
  } catch (error) {
    console.error("Payment processing error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }
  }
}
