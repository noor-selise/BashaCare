import type { BlocksOidcUserInfo } from "@seliseblocks/client"
import { getBlocksClient, isBlocksConfigured } from "@/lib/blocks/client"

const RETURN_TO_KEY = "bashacare.returnTo"

export const startLogin = async (returnTo = "/") => {
  if (!isBlocksConfigured) {
    throw new Error("Login is not configured. Set NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID in .env.local.")
  }

  const client = getBlocksClient()
  if (!client) {
    throw new Error("Login is not configured. Set NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID in .env.local.")
  }

  sessionStorage.setItem(RETURN_TO_KEY, returnTo)
  await client.auth.idp.redirectToProvider()
}

export const completeLogin = async (callbackUrl: string) => {
  const client = getBlocksClient()
  const returnTo = sessionStorage.getItem(RETURN_TO_KEY) || "/"
  sessionStorage.removeItem(RETURN_TO_KEY)

  if (!client) {
    return { ok: false as const, message: "Login is not configured.", returnTo }
  }

  const data = await client.auth.idp.callback(callbackUrl)
  if (data.error) {
    return {
      ok: false as const,
      message: data.error_description || data.error,
      returnTo
    }
  }

  return { ok: true as const, returnTo }
}

export const fetchSessionClaims = async (): Promise<BlocksOidcUserInfo | null> => {
  const client = getBlocksClient()
  if (!client) return null

  try {
    const signedIn = await client.auth.isAuthenticated()
    if (!signedIn) return null
    return await client.auth.userInfo()
  } catch {
    return null
  }
}

export const logoutBlocks = async () => {
  const client = getBlocksClient()
  if (!client) return
  await client.auth.logout()
}
