/**
 * Frontend API wrapper for communicating with the backend.
 * All requests include credentials for cookie-based JWT auth.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiRequestOptions extends RequestInit {
  // Extends the standard fetch options
}

async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for JWT auth
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Products
  get_products: (search?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const queryString = params.toString()
    return apiRequest<{ items: any[]; total: number; page: number; pages: number }>(
      queryString ? `/api/products?${queryString}` : '/api/products'
    )
  },
  get_product: (id: string) => apiRequest<any>(`/api/products/${id}`),
  create_product: (data: any) => apiRequest<any>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  bulk_create_products: (items: any[]) =>
    apiRequest<any>('/api/products/bulk', { method: 'POST', body: JSON.stringify({ items }) }),
  update_product: (id: string, data: any) =>
    apiRequest<any>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete_product: (id: string) => apiRequest<any>(`/api/products/${id}`, { method: 'DELETE' }),

  // Orders
  create_order: (data: any) => apiRequest<any>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  get_orders: (status?: string, page?: number, limit?: number, paymentStatus?: string) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (paymentStatus) params.append('paymentStatus', paymentStatus)
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const queryString = params.toString()
    return apiRequest<{ items: any[]; total: number; page: number; pages: number }>(
      queryString ? `/api/orders?${queryString}` : '/api/orders'
    )
  },
  get_order: (id: string) => apiRequest<any>(`/api/orders/${id}`),
  update_order_status: (id: string, status: string) =>
    apiRequest<any>(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  update_payment_status: (id: string, paymentStatus: string) =>
    apiRequest<any>(`/api/orders/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ paymentStatus }) }),
  get_payment_methods: () => apiRequest<{ methods: any[] }>('/api/payment-methods'),

  // Addons
  get_addons: (compatibleWith?: string) => {
    const query = compatibleWith ? `?compatibleWith=${encodeURIComponent(compatibleWith)}` : ''
    return apiRequest<{ items: any[]; total: number; page: number; pages: number } | any[]>(`/api/addons${query}`)
  },
  create_addon: (data: any) => apiRequest<any>('/api/addons', { method: 'POST', body: JSON.stringify(data) }),
  update_addon: (id: string, data: any) =>
    apiRequest<any>(`/api/addons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete_addon: (id: string) => apiRequest<any>(`/api/addons/${id}`, { method: 'DELETE' }),

  // Accessories
  get_accessories: (search?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (page) params.append('page', page.toString())
    if (limit) params.append('limit', limit.toString())
    const queryString = params.toString()
    return apiRequest<{ items: any[]; total: number; page: number; pages: number }>(
      queryString ? `/api/accessories?${queryString}` : '/api/accessories'
    )
  },
  get_accessory: (id: string) => apiRequest<any>(`/api/accessories/${id}`),
  create_accessory: (data: any) => apiRequest<any>('/api/accessories', { method: 'POST', body: JSON.stringify(data) }),
  update_accessory: (id: string, data: any) =>
    apiRequest<any>(`/api/accessories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete_accessory: (id: string) => apiRequest<any>(`/api/accessories/${id}`, { method: 'DELETE' }),

  // Shipping Rates
  get_shipping_rates: () => apiRequest<any[]>('/api/shipping-rates'),
  update_shipping_rate: (governorate: string, data: { cost?: number; estimatedDays?: number; active?: boolean }) =>
    apiRequest<any>(`/api/shipping-rates/${encodeURIComponent(governorate)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Inventory
  get_inventory: (category?: string, lowStock?: boolean) => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (lowStock) params.append('lowStock', 'true')
    const query = params.toString()
    return apiRequest<any[]>(query ? `/api/inventory?${query}` : '/api/inventory')
  },
  adjust_inventory: (data: {
    itemType: 'laptop' | 'addon' | 'accessory'
    itemId: string
    quantity: number
    reason: string
    stockStatus?: string
  }) => apiRequest<any>('/api/inventory', { method: 'PATCH', body: JSON.stringify(data) }),
  get_inventory_logs: () => apiRequest<any[]>('/api/inventory/logs'),

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
  get_admin_pricelist: () => apiRequest<any>('/api/pricelist/admin'),
  update_pricelist_item: (pricelistId: string, itemId: string, data: any) =>
    apiRequest<any>(`/api/pricelist/${pricelistId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete_pricelist_item: (pricelistId: string, itemId: string) =>
    apiRequest<any>(`/api/pricelist/${pricelistId}/items/${itemId}`, {
      method: 'DELETE',
    }),
  delete_all_pricelist_items: (pricelistId: string) =>
    apiRequest<any>(`/api/pricelist/${pricelistId}/items`, {
      method: 'DELETE',
    }),
  export_pricelist: async (pricelistId: string) => {
    const response = await fetch(`${API_URL}/api/pricelist/${pricelistId}/export`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `API error: ${response.status}`)
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pricelist_exported_${Date.now()}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  },
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

  // Settings
  get_settings: () => apiRequest<{ vodafoneCashNumber: string; instapayNumber: string; activeUploadThingTokenIndex: number }>('/api/settings'),
  update_settings: (data: { vodafoneCashNumber: string; instapayNumber: string; activeUploadThingTokenIndex?: number }) =>
    apiRequest<any>('/api/settings', { method: 'POST', body: JSON.stringify(data) }),

  // Admin Auth
  login: (username: string, password: string) =>
    apiRequest<any>('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => apiRequest<any>('/admin/logout', { method: 'POST' }),
}

export default api
