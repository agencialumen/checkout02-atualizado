"use client"

interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
  gclid?: string
}

export class UTMTracker {
  private static instance: UTMTracker
  private utmParams: UTMParams = {}

  private constructor() {
    this.captureUTMParams()
  }

  public static getInstance(): UTMTracker {
    if (!UTMTracker.instance) {
      UTMTracker.instance = new UTMTracker()
    }
    return UTMTracker.instance
  }

  private captureUTMParams() {
    if (typeof window === "undefined") return

    const urlParams = new URLSearchParams(window.location.search)
    this.utmParams = {
      utm_source: urlParams.get("utm_source") || undefined,
      utm_medium: urlParams.get("utm_medium") || undefined,
      utm_campaign: urlParams.get("utm_campaign") || undefined,
      utm_content: urlParams.get("utm_content") || undefined,
      utm_term: urlParams.get("utm_term") || undefined,
      fbclid: urlParams.get("fbclid") || undefined,
      gclid: urlParams.get("gclid") || undefined,
    }
    localStorage.setItem("utm_params", JSON.stringify(this.utmParams))
  }

  public getUTMParams(): UTMParams {
    if (Object.keys(this.utmParams).length === 0 && typeof window !== "undefined") {
      const saved = localStorage.getItem("utm_params")
      if (saved) {
        this.utmParams = JSON.parse(saved)
      }
    }
    return this.utmParams
  }

  // 🎯 EVENTO 1: InitiateCheckout - Entrada no checkout
  public trackInitiateCheckout(value: number, currency = "BRL") {
    if (typeof window === "undefined") return

    const utmParams = this.getUTMParams()

    // Meta Pixel
    if (window.fbq && typeof window.fbq === "function") {
      try {
        window.fbq("track", "InitiateCheckout", {
          value: value,
          currency: currency,
          content_type: "product",
          content_ids: ["kit-pampers-premium"],
          content_name: "Kit Pampers Premium",
          content_category: "Baby Products",
          num_items: 1,
          ...utmParams,
        })
        console.log("✅ Meta InitiateCheckout:", value)
      } catch (error) {
        console.log("❌ Meta InitiateCheckout error:", error)
      }
    }

    // TikTok Pixel - Simplificado
    if (window.ttq && typeof window.ttq === "function") {
      try {
        window.ttq("track", "InitiateCheckout", {
          value: value,
          currency: currency,
          content_type: "product",
          content_id: "kit-pampers-premium",
          content_name: "Kit Pampers Premium",
          content_category: "Baby Products",
          quantity: 1,
          ...utmParams,
        })
        console.log("🎯 TikTok InitiateCheckout:", value)
      } catch (error) {
        console.log("❌ TikTok InitiateCheckout error:", error)
      }
    } else {
      console.log("⚠️ TikTok pixel não disponível para InitiateCheckout")
    }
  }

  // 🎯 EVENTO 2: AddToCart - Order bumps adicionados
  public trackAddToCart(value: number, contentId: string, contentName: string) {
    if (typeof window === "undefined") return

    const utmParams = this.getUTMParams()

    // Meta Pixel
    if (window.fbq && typeof window.fbq === "function") {
      try {
        window.fbq("track", "AddToCart", {
          value: value,
          currency: "BRL",
          content_type: "product",
          content_ids: [contentId],
          content_name: contentName,
          content_category: "Baby Products",
          ...utmParams,
        })
        console.log("✅ Meta AddToCart:", contentName, value)
      } catch (error) {
        console.log("❌ Meta AddToCart error:", error)
      }
    }

    // TikTok Pixel - Simplificado
    if (window.ttq && typeof window.ttq === "function") {
      try {
        window.ttq("track", "AddToCart", {
          value: value,
          currency: "BRL",
          content_type: "product",
          content_id: contentId,
          content_name: contentName,
          content_category: "Baby Products",
          quantity: 1,
          ...utmParams,
        })
        console.log("🎯 TikTok AddToCart:", contentName, value)
      } catch (error) {
        console.log("❌ TikTok AddToCart error:", error)
      }
    } else {
      console.log("⚠️ TikTok pixel não disponível para AddToCart")
    }
  }

  // 🎯 EVENTO 3: Purchase - Pagamento confirmado
  public trackPurchase(value: number, transactionId: string, currency = "BRL") {
    if (typeof window === "undefined") return

    const utmParams = this.getUTMParams()

    // Meta Pixel
    if (window.fbq && typeof window.fbq === "function") {
      try {
        window.fbq("track", "Purchase", {
          value: value,
          currency: currency,
          content_type: "product",
          content_ids: ["kit-pampers-premium"],
          content_name: "Kit Pampers Premium",
          content_category: "Baby Products",
          num_items: 1,
          transaction_id: transactionId,
          ...utmParams,
        })
        console.log("✅ Meta Purchase:", value, transactionId)
      } catch (error) {
        console.log("❌ Meta Purchase error:", error)
      }
    }

    // TikTok Pixel - Simplificado
    if (window.ttq && typeof window.ttq === "function") {
      try {
        window.ttq("track", "Purchase", {
          value: value,
          currency: currency,
          content_type: "product",
          content_id: "kit-pampers-premium",
          content_name: "Kit Pampers Premium",
          content_category: "Baby Products",
          quantity: 1,
          order_id: transactionId,
          ...utmParams,
        })
        console.log("🎯 TikTok Purchase:", value, transactionId)
      } catch (error) {
        console.log("❌ TikTok Purchase error:", error)
      }
    } else {
      console.log("⚠️ TikTok pixel não disponível para Purchase")
    }
  }
}
