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
import { isBlocksConfigured } from "@/lib/blocks/client"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthApi = {
  configured: boolean
  status: AuthStatus
  claims: BlocksOidcUserInfo | null
  login: (returnTo?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthApi | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [claims, setClaims] = useState<BlocksOidcUserInfo | null>(null)

  const refresh = useCallback(async () => {
    if (!isBlocksConfigured) {
      setClaims(null)
      setStatus("unauthenticated")
      return
    }

    try {
      const next = await fetchSessionClaims()
      setClaims(next)
      setStatus(next ? "authenticated" : "unauthenticated")
    } catch {
      setClaims(null)
      setStatus("unauthenticated")
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
      login: startLogin,
      logout: async () => {
        await logoutBlocks()
        setClaims(null)
        setStatus("unauthenticated")
      },
      refresh
    }
  }, [claims, refresh, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
