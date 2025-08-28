import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MetaPixel } from "@/components/meta-pixel"
import { TikTokPixel } from "@/components/tiktok-pixel"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kit Pampers Premium - Oferta Especial",
  description: "9 Pacotes de Fraldas + 6 Pacotes de Lenços - Apenas pague o frete",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <MetaPixel />
        <TikTokPixel />
        {children}
      </body>
    </html>
  )
}
