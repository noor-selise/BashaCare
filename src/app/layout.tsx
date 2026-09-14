import type { Metadata } from "next"
import { Figtree, Fraunces, IBM_Plex_Mono, Noto_Sans_Bengali } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  adjustFontFallback: false,
  display: "swap"
})

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  adjustFontFallback: false,
  display: "swap"
})

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-sans-bengali",
  adjustFontFallback: false,
  display: "swap"
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  adjustFontFallback: false,
  display: "swap"
})

export const metadata: Metadata = {
  title: "BashaCare · Uttara Heights",
  description: "Apartment maintenance and resident requests for one building in Uttara."
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${figtree.variable} ${fraunces.variable} ${notoSansBengali.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-canvas font-sans text-ink antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout
