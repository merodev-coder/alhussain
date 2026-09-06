export type StockStatus = 'in_stock' | 'limited' | 'out_of_stock'

export type HomeSection = 'graphics' | 'business' | 'accessories' | 'batteries' | 'storage' | null

export type Product = {
  id: string
  name: string
  model?: string
  price: number
  description: string
  cpu: string
  gpu: string
  ram: string
  storage: string
  screen?: string
  photos: string[]
  stockStatus: StockStatus
  quantity?: number
  discountBadge?: string
  badge?: string | null
  visible: boolean
  isActive?: boolean
  homeSection?: HomeSection
  specs?: {
    cpu?: string
    ram?: string
    storage?: string
    screen?: string
    gpu?: string
  }
  categoryId?: string
  dbIndex?: number
  createdAt?: string
}

export interface HeroSlide {
  id: string
  headline: string
  subtitle: string
  buttonText: string
  buttonColor?: string
  buttonLink: string
  badgeImage?: string | null
  images: string[]
  isActive: boolean
  order: number
}

export interface CategoryQuickAccess {
  id: string
  name: string
  slug: string
  icon: import('lucide-react').LucideIcon
  sectionKey: 'graphics' | 'business' | 'accessories' | 'batteries' | 'storage'
}

export type AddonCategory = 'ram' | 'storage' | 'accessory' | 'other'

export type Addon = {
  id: string
  name: string
  price: number
  description: string
  category: AddonCategory
  compatibleWith: string[]
  photos: string[]
  stockStatus: StockStatus
  quantity: number
  visible: boolean
  dbIndex?: number
}

export type Accessory = {
  id: string
  name: string
  price: number
  description: string
  category: string
  photos: string[]
  stockStatus: StockStatus
  quantity: number
  visible: boolean
  dbIndex?: number
}

export type SelectedAddon = {
  addonId: string
  name: string
  price: number
  qty: number
}

export type CartItem = {
  itemType: 'laptop' | 'accessory'
  product: Product | Accessory
  qty: number
  selectedAddons?: SelectedAddon[]
}

export type OrderItem = {
  productId: string
  itemType: 'laptop' | 'accessory'
  name: string
  price: number
  priceAtOrder?: number
  qty: number
  selectedAddons?: SelectedAddon[]
}

export type PaymentMethod = 'vodafone_cash' | 'instapay'
export type PaymentStatus = 'pending_verification' | 'confirmed' | 'rejected'

export type Order = {
  id: string
  orderNumber?: string
  customerName: string
  phone: string
  address: string
  governorate: string
  deliveryMethod: 'shipping' | 'pickup'
  depositPhotoUrl?: string
  items: OrderItem[]
  shippingCost?: number
  total: number
  status: 'pending' | 'confirmed' | 'declined' | 'shipped' | 'completed'
  paymentMethod?: PaymentMethod
  isCashOnDelivery?: boolean
  depositAmount?: number
  paymentStatus?: PaymentStatus
  stockDecremented?: boolean
  dbIndex?: number
  createdAt?: string
}

export type ShippingRate = {
  id: string
  governorate: string
  cost: number
  estimatedDays: number
  active: boolean
  dbIndex?: number
}

export type InventoryItem = {
  id: string
  name: string
  category: 'laptop' | 'addon' | 'accessory'
  subcategory?: string
  stockStatus: StockStatus
  quantity: number
  dbIndex?: number
}

export type InventoryLog = {
  id: string
  itemType: 'laptop' | 'addon' | 'accessory'
  itemId: string
  itemName: string
  adminUser: string
  oldQty: number
  newQty: number
  reason: string
  date: string
}

