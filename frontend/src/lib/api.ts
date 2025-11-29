import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: number
  username: string
  email: string
  is_active: boolean
  role: 'admin' | 'user'
  created_at: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface PanelInstance {
  id: number
  name: string
  url: string
  description?: string
  is_active: boolean
  owner_id: number
  created_at: string
  api_key?: string
}

export interface PanelCreateData {
  name: string
  url: string
  api_key: string
  description?: string
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
  owner_id: number
  created_at: string
  updated_at: string
  json_data?: Record<string, unknown>
}

export interface EggCreateData {
  source_url: string
  visibility?: 'public' | 'private'
  java_version?: number
}

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<Token> => {
    const formData = new URLSearchParams()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  },
  
  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/users/me')
    return response.data
  },
}

// Panels API
export const panelsApi = {
  list: async (): Promise<PanelInstance[]> => {
    const response = await api.get('/panels')
    return response.data
  },
  
  get: async (id: number): Promise<PanelInstance> => {
    const response = await api.get(`/panels/${id}`)
    return response.data
  },
  
  create: async (data: PanelCreateData): Promise<PanelInstance> => {
    const response = await api.post('/panels', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<PanelCreateData>): Promise<PanelInstance> => {
    const response = await api.patch(`/panels/${id}`, data)
    return response.data
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/panels/${id}`)
  },
  
  test: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/panels/${id}/test`)
    return response.data
  },
}

// Eggs API
export const eggsApi = {
  list: async (visibility?: 'public' | 'private'): Promise<EggConfig[]> => {
    const params = visibility ? { visibility } : {}
    const response = await api.get('/eggs', { params })
    return response.data
  },
  
  get: async (id: number): Promise<EggConfig> => {
    const response = await api.get(`/eggs/${id}`)
    return response.data
  },
  
  create: async (data: EggCreateData): Promise<EggConfig> => {
    const response = await api.post('/eggs', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<EggConfig>): Promise<EggConfig> => {
    const response = await api.patch(`/eggs/${id}`, data)
    return response.data
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/eggs/${id}`)
  },
  
  export: async (id: number): Promise<Record<string, unknown>> => {
    const response = await api.get(`/eggs/${id}/export`)
    return response.data
  },
  
  regenerate: async (id: number): Promise<EggConfig> => {
    const response = await api.post(`/eggs/${id}/regenerate`)
    return response.data
  },
}
