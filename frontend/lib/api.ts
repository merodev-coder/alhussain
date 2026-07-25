/**
 * Frontend API wrapper for communicating with the backend.
 * All requests include credentials for cookie-based JWT auth.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

console.log('[API] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('[API] Using API_URL:', API_URL)

interface ApiRequestOptions extends RequestInit {
  // Extends the standard fetch options
}

async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`
  console.log('[API] Requesting:', url, options.method || 'GET')

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for JWT auth
  })

  console.log('[API] Response status:', response.status, 'for', url)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.log('[API] Error:', error)
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Products
  get_products: (search?: string) =>
    apiRequest<any[]>(search ? `/api/products?search=${encodeURIComponent(search)}` : '/api/products'),
  get_product: (id: string) => apiRequest<any>(`/api/products/${id}`),
  create_product: (data: any) => apiRequest<any>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update_product: (id: string, data: any) =>
    apiRequest<any>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete_product: (id: string) => apiRequest<any>(`/api/products/${id}`, { method: 'DELETE' }),

  // Orders
  create_order: (data: any) => apiRequest<any>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  get_orders: (status?: string) =>
    apiRequest<any[]>(status ? `/api/orders?status=${encodeURIComponent(status)}` : '/api/orders'),
  get_order: (id: string) => apiRequest<any>(`/api/orders/${id}`),
  update_order_status: (id: string, status: string) =>
    apiRequest<any>(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Spec Options
  get_spec_options: (type?: string) =>
    apiRequest<any[]>(type ? `/api/spec-options?type=${encodeURIComponent(type)}` : '/api/spec-options'),
  create_spec_option: (data: any) =>
    apiRequest<any>('/api/spec-options', { method: 'POST', body: JSON.stringify(data) }),
  update_spec_option: (id: string, data: any) =>
    apiRequest<any>(`/api/spec-options/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete_spec_option: (id: string) => apiRequest<any>(`/api/spec-options/${id}`, { method: 'DELETE' }),

  // Pricelist
  get_pricelist: () => apiRequest<any>('/api/pricelist'),
  upload_pricelist: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/api/pricelist`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for JWT auth
      // Omit Content-Type header so browser sets multipart boundary
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `API error: ${response.status}`)
    }

    return response.json()
  },

  // Dashboard
  get_dashboard_stats: () => apiRequest<any>('/api/dashboard-stats'),

  // Admin Auth
  login: (username: string, password: string) =>
    apiRequest<any>('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => apiRequest<any>('/admin/logout', { method: 'POST' }),
  check_session: async () => {
    const response = await fetch(`${API_URL}/admin/session`, {
      credentials: 'include',
    })
    if (!response.ok) {
      return { authenticated: false }
    }
    return response.json()
  },
}

export default api
