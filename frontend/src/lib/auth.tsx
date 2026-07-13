/* eslint-disable react-refresh/only-export-components -- the provider and its hook belong in one module; the cost is a full reload when this file changes. */
import { createContext, use, useEffect, type ReactNode } from 'react'
import { AuthProvider as OidcProvider, useAuth as useOidcAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'
import { setAccessToken } from './api'

export interface AuthConfig {
  mode: 'dev' | 'zitadel'
  authority: string
  client_id: string
}

/** Fetched once at startup so OIDC settings are not baked into the build. */
export async function fetchAuthConfig(): Promise<AuthConfig> {
  const response = await fetch('/api/auth/config')
  if (!response.ok) throw new Error(`Auth config unavailable (${response.status})`)
  return response.json()
}

interface Session {
  user: { id: string; name: string; email: string } | null
  roles: string[]
  isAdmin: boolean
  /** Whether to offer edit/delete controls. UI affordance only: the backend
   *  re-checks ownership on every request. */
  canManage: (ownerId: string) => boolean
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
  /** Where the identity provider lets a user manage their account; null in dev mode. */
  accountUrl: string | null
}

const SessionContext = createContext<Session | null>(null)

export function useAuth(): Session {
  const session = use(SessionContext)
  if (!session) throw new Error('useAuth must be used inside <AuthProvider>')
  return session
}

// Must match DEV_USER in the backend's app/core/security.py.
const DEV_SESSION: Session = {
  user: { id: 'dev-user', name: 'Local Developer', email: 'dev@localhost' },
  roles: ['ADMIN', 'MEMBER'],
  isAdmin: true,
  canManage: () => true,
  isAuthenticated: true,
  isLoading: false,
  login: () => {},
  logout: () => {},
  accountUrl: null,
}

/** Maps react-oidc-context state onto Session. Always rendered under <OidcProvider>. */
function ZitadelSession({ config, children }: { config: AuthConfig; children: ReactNode }) {
  const auth = useOidcAuth()
  const profile = auth.user?.profile
  const accessToken = auth.user?.access_token

  useEffect(() => {
    setAccessToken(accessToken ?? null)
  }, [accessToken])

  const roles = Object.keys(
    (profile?.['urn:zitadel:iam:org:project:roles'] as Record<string, unknown>) ?? {},
  )
  const isAdmin = roles.includes('ADMIN')
  const userId = profile?.sub ?? ''

  const session: Session = {
    user: profile
      ? {
          id: userId,
          name: (profile.name ?? profile.preferred_username ?? '') as string,
          email: (profile.email ?? '') as string,
        }
      : null,
    roles,
    isAdmin,
    canManage: (ownerId) => isAdmin || ownerId === userId,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login: () => void auth.signinRedirect(),
    logout: () => void auth.signoutRedirect(),
    accountUrl: `${config.authority}/ui/console/users/me`,
  }

  return <SessionContext value={session}>{children}</SessionContext>
}

export function AuthProvider({ config, children }: { config: AuthConfig; children: ReactNode }) {
  if (config.mode === 'dev') {
    return <SessionContext value={DEV_SESSION}>{children}</SessionContext>
  }

  return (
    <OidcProvider
      authority={config.authority}
      client_id={config.client_id}
      redirect_uri={`${window.location.origin}/callback`}
      post_logout_redirect_uri={`${window.location.origin}/login`}
      scope="openid profile email"
      response_type="code"
    >
      <ZitadelSession config={config}>{children}</ZitadelSession>
    </OidcProvider>
  )
}

/** Rendered at the OIDC redirect_uri while react-oidc-context exchanges the code. */
export function AuthCallback() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return
    const destination = sessionStorage.getItem('auth_redirect') ?? '/dashboard'
    sessionStorage.removeItem('auth_redirect')
    navigate(isAuthenticated ? destination : '/login', { replace: true })
  }, [isAuthenticated, isLoading, navigate])

  return <p className="flex h-screen items-center justify-center">Completing sign-in…</p>
}
