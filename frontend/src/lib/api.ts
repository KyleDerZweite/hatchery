// The API is always same-origin: the Vite dev server and the production nginx
// config both proxy /api to the backend.
const BASE_URL = '/api'

/** Carries the backend's `detail` string as its message, so callers can show it directly. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let accessToken: string | null = null

/** Set by the auth provider. Null in dev mode, where the backend expects no token. */
export function setAccessToken(token: string | null) {
  accessToken = token
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) window.location.href = '/login'
    const detail = await response
      .json()
      .then((body) => body?.detail)
      .catch(() => null)
    throw new ApiError(
      response.status,
      typeof detail === 'string' ? detail : `Request failed (${response.status})`,
    )
  }

  return response.status === 204 ? (undefined as T) : response.json()
}

const send = <T>(method: string, path: string, body?: unknown) =>
  request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })

export interface PanelInstance {
  id: number
  name: string
  url: string
  description?: string
  is_active: boolean
  owner_id: string
  created_at: string
  updated_at: string
  last_tested_at?: string | null
  last_test_status: string
  last_test_message: string
  has_api_key: boolean
}

export interface PanelCreateData {
  name: string
  url: string
  api_key: string
  description?: string
}

export interface PanelConnectionResult {
  success: boolean
  status: 'ok' | 'failed'
  message: string
  panel_type?: string | null
  checked_endpoint?: string | null
}

export interface EggConfig {
  id: number
  name: string
  source_url: string
  source: 'curseforge' | 'modrinth' | 'unknown'
  description?: string
  java_version: number
  visibility: 'public' | 'private'
  minecraft_version?: string
  modloader?: string
  modloader_version?: string
  owner_id: string
  created_at: string
  updated_at: string
  json_data?: Record<string, unknown>
}

export interface EggCreateData {
  source_url: string
  visibility?: 'public' | 'private'
  java_version?: number
}

export const panelsApi = {
  list: () => request<PanelInstance[]>('/panels'),
  create: (data: PanelCreateData) => send<PanelInstance>('POST', '/panels', data),
  delete: (id: number) => send<void>('DELETE', `/panels/${id}`),
  test: (id: number) => send<PanelConnectionResult>('POST', `/panels/${id}/test`),
}

export const eggsApi = {
  list: () => request<EggConfig[]>('/eggs'),
  get: (id: number) => request<EggConfig>(`/eggs/${id}`),
  create: (data: EggCreateData) => send<EggConfig>('POST', '/eggs', data),
  update: (id: number, data: Partial<EggConfig>) => send<EggConfig>('PATCH', `/eggs/${id}`, data),
  delete: (id: number) => send<void>('DELETE', `/eggs/${id}`),
  export: (id: number) => request<Record<string, unknown>>(`/eggs/${id}/export`),
  regenerate: (id: number) => send<EggConfig>('POST', `/eggs/${id}/regenerate`),
}
