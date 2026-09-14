"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react"
import type { BlocksOidcUserInfo } from "@seliseblocks/client"
import {
  fetchSessionClaims,
  logoutBlocks,
  startLogin
} from "@/lib/blocks/auth"
import { getBlocksClient, isBlocksConfigured } from "@/lib/blocks/client"
import { roleSlugsFromUnknown } from "@/data/directory"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthApi = {
  configured: boolean
  status: AuthStatus
  claims: BlocksOidcUserInfo | null
  roles: string[]
  login: (returnTo?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<{ claims: BlocksOidcUserInfo | null; roles: string[] }>
}

const AuthContext = createContext<AuthApi | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [claims, setClaims] = useState<BlocksOidcUserInfo | null>(null)
  const [roles, setRoles] = useState<string[]>([])

  const refresh = useCallback(async () => {
    if (!isBlocksConfigured) {
      setClaims(null)
      setRoles([])
      setStatus("unauthenticated")
      return { claims: null, roles: [] as string[] }
    }

    try {
      const next = await fetchSessionClaims()
      if (!next) {
        setClaims(null)
        setRoles([])
        setStatus("unauthenticated")
        return { claims: null, roles: [] as string[] }
      }

      const client = getBlocksClient()
      const me = client ? await client.iam.me().catch(() => null) : null
      const record = (me as { data?: { roles?: unknown } } | null)?.data
      const nextRoles = roleSlugsFromUnknown(record?.roles ?? next.roles)
      setClaims(next)
      setRoles(nextRoles)
      setStatus("authenticated")
      return { claims: next, roles: nextRoles }
    } catch {
      setClaims(null)
      setRoles([])
      setStatus("unauthenticated")
      return { claims: null, roles: [] as string[] }
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthApi>(() => {
    return {
      configured: isBlocksConfigured,
      status,
      claims,
      roles,
      login: startLogin,
      logout: async () => {
        try {
          await logoutBlocks()
        } finally {
          setClaims(null)
          setRoles([])
          setStatus("unauthenticated")
        }
      },
      refresh
    }
  }, [claims, refresh, roles, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
