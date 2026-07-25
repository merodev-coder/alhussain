export type Product = {
  id: string
  name: string
  price: number
  description: string
  cpu: string
  gpu: string
  ram: string
  storage: string
  photos: string[]
  stockStatus: 'in_stock' | 'limited' | 'out_of_stock'
  discountBadge?: string
  visible: boolean
}

export type OrderItem = {
  productId: string
  name: string
  price: number
  qty: number
}

export type Order = {
  id: string
  customerName: string
  phone: string
  address: string
  governorate: string
  deliveryMethod: 'shipping' | 'pickup'
  depositPhotoUrl?: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'declined' | 'shipped' | 'completed'
}

export type CartItem = {
  product: Product
  qty: number
}
