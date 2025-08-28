import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log the webhook for debugging
    console.log("LiraPay Webhook received:", body)

    // Here you can process the webhook data
    // For example, update order status in your database
    const { id, external_id, total_amount, status, payment_method } = body

    // Process based on status
    switch (status) {
      case "AUTHORIZED":
        console.log(`Payment authorized for transaction ${id}`)
        // Update order status to paid
        break
      case "FAILED":
        console.log(`Payment failed for transaction ${id}`)
        // Update order status to failed
        break
      case "CHARGEBACK":
        console.log(`Chargeback for transaction ${id}`)
        // Handle chargeback
        break
      case "IN_DISPUTE":
        console.log(`Dispute for transaction ${id}`)
        // Handle dispute
        break
      default:
        console.log(`Unknown status ${status} for transaction ${id}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
