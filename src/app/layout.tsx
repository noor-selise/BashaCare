import type { Metadata } from "next"
import { Figtree, Fraunces, IBM_Plex_Mono, Noto_Sans_Bengali } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree"
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces"
})

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-sans-bengali"
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono"
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
    >
      <body className="bg-canvas text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout
