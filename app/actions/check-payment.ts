"use server"

import { getTransaction } from "@/lib/lirapay"

export async function checkPaymentStatus(transactionId: string) {
  try {
    const transaction = await getTransaction(transactionId)

    return {
      success: true,
      status: transaction.status,
      transaction,
    }
  } catch (error) {
    console.error("Error checking payment status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao verificar pagamento",
    }
  }
}
