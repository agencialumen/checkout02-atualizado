"use client"
import Script from "next/script"
import { useEffect } from "react"

declare global {
  interface Window {
    ttq: any
    TiktokAnalyticsObject: string
    tiktokPixelReady?: boolean
    tiktokPixelCallbacks?: Array<() => void>
  }
}

export function TikTokPixel() {
  useEffect(() => {
    // Sistema de callbacks para quando o pixel estiver pronto
    window.tiktokPixelCallbacks = window.tiktokPixelCallbacks || []

    // MutationObserver para detectar quando ttq se torna uma função
    const observer = new MutationObserver(() => {
      if (window.ttq && typeof window.ttq === "function" && !window.tiktokPixelReady) {
        console.log("🎯 TikTok Pixel detected as ready via MutationObserver!")
        window.tiktokPixelReady = true

        // Executar todos os callbacks pendentes
        window.tiktokPixelCallbacks?.forEach((callback) => {
          try {
            callback()
          } catch (error) {
            console.error("❌ TikTok callback error:", error)
          }
        })

        // Limpar callbacks
        window.tiktokPixelCallbacks = []
        observer.disconnect()
      }
    })

    // Observar mudanças no window object
    observer.observe(document, {
      childList: true,
      subtree: true,
    })

    // Cleanup
    return () => observer.disconnect()
  }, [])

  const handleScriptLoad = () => {
    console.log("📡 TikTok Script loaded via onLoad")

    // Verificar se já está pronto imediatamente
    if (window.ttq && typeof window.ttq === "function") {
      console.log("✅ TikTok Pixel ready immediately after script load!")
      window.ttq.page()
    } else {
      // Se não estiver pronto, aguardar um pouco mais
      console.log("⏳ TikTok Script loaded but ttq not ready yet, waiting...")
      setTimeout(() => {
        if (window.ttq && typeof window.ttq === "function") {
          console.log("✅ TikTok Pixel ready after timeout!")
          window.ttq.page()
        }
      }, 1000)
    }
  }

  return (
    <>
      <Script
        id="tiktok-pixel"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={() => console.error("❌ TikTok Script failed to load")}
        dangerouslySetInnerHTML={{
          __html: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
              var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
              ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              
              console.log("🚀 TikTok Pixel: Initializing with official code...");
              ttq.load('D2HPODRC77U4ENLNET30');
              console.log("📡 TikTok: Pixel loaded without PageView");
            }(window, document, 'ttq');
          `,
        }}
      />
    </>
  )
}
