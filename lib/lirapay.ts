interface LiraPayItem {
  id: string
  title: string
  description: string
  price: number
  quantity: number
  is_physical: boolean
}

interface LiraPayCustomer {
  name: string
  email: string
  phone: string
  document_type: "CPF" | "CNPJ"
  document: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

interface LiraPayAddress {
  cep: string
  city: string
  state: string
  number: string
  street: string
  complement?: string
  neighborhood: string
}

interface CreateTransactionRequest {
  external_id: string
  total_amount: number
  payment_method: "PIX"
  webhook_url: string
  items: LiraPayItem[]
  ip: string
  customer: LiraPayCustomer
}

// ✅ Interface corrigida baseada na documentação da API
interface CreateTransactionResponse {
  id: string
  external_id: string
  status: "AUTHORIZED" | "PENDING" | "CHARGEBACK" | "FAILED" | "IN_DISPUTE"
  total_value: number // ✅ API retorna "total_value", não "totalAmount"
  customer: {
    email: string
    name: string
  }
  payment_method: string
  pix: {
    payload: string
  }
  hasError: boolean
}

const LIRAPAY_API_BASE = "https://api.lirapaybr.com"
const API_SECRET =
  process.env.LIRAPAY_API_SECRET ||
  "sk_2d1ec37d32b6f581fcc6edf95662201732a8684dce1fd1c834796082b98dbacac5f9d93af83e8ea5a64833f878215196391ffd18cd5d99623cfac77a8175377d"

export async function createTransaction(data: CreateTransactionRequest): Promise<CreateTransactionResponse> {
  const response = await fetch(`${LIRAPAY_API_BASE}/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-secret": API_SECRET,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`LiraPay API Error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  return response.json()
}

export async function getTransaction(transactionId: string) {
  const response = await fetch(`${LIRAPAY_API_BASE}/v1/transactions/${transactionId}`, {
    headers: {
      "api-secret": API_SECRET,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get transaction: ${response.status}`)
  }

  return response.json()
}

export async function getAccountInfo() {
  const response = await fetch(`${LIRAPAY_API_BASE}/v1/account-info`, {
    headers: {
      "api-secret": API_SECRET,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get account info: ${response.status}`)
  }

  return response.json()
}
