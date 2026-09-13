import { createBlocksClient, type BlocksClient } from "@seliseblocks/client"

const xBlocksKey = process.env.NEXT_PUBLIC_BLOCKS_X_BLOCKS_KEY
const apiUrl = process.env.NEXT_PUBLIC_BLOCKS_API_URL
const clientId = process.env.NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID
const oidcUrl = process.env.NEXT_PUBLIC_BLOCKS_OIDC_URL ?? "https://iam.seliseblocks.com"
const appDomain = process.env.NEXT_PUBLIC_BLOCKS_APP_DOMAIN

export const isBlocksConfigured = Boolean(xBlocksKey && apiUrl && clientId)

let cachedClient: BlocksClient | null = null

export const getBlocksClient = () => {
  if (!isBlocksConfigured) return null
  if (typeof window === "undefined") return null
  if (cachedClient) return cachedClient

  cachedClient = createBlocksClient({
    apiUrl: apiUrl as string,
    xBlocksKey: xBlocksKey as string,
    appDomain,
    oidc: {
      url: oidcUrl,
      clientId: clientId as string
    }
  })

  return cachedClient
}
