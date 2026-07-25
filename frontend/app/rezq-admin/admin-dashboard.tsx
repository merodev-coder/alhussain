'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Search,
  ChevronDown,
  X,
  Check,
  Truck,
  Clock,
  Ban,
  Eye,
  Menu,
  ExternalLink,
  Phone,
  MapPin,
} from 'lucide-react'
import { MOCK_ORDERS, MOCK_PRODUCTS } from '@/lib/mock-data'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'
import ProductsTab from './products-tab'
import PricelistTab from './pricelist-tab'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = Order['status']

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: 'قيد الانتظار',
    className: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  confirmed: {
    label: 'مؤكد',
    className: 'bg-blue-100 text-blue-700',
    icon: Check,
  },
  declined: {
    label: 'مرفوض',
    className: 'bg-red-100 text-red-600',
    icon: Ban,
  },
  shipped: {
    label: 'تم الشحن',
    className: 'bg-purple-100 text-purple-700',
    icon: Truck,
  },
  completed: {
    label: 'مكتمل',
    className: 'bg-green-100 text-green-700',
    icon: Check,
  },
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
  { id: 'products', label: 'المنتجات', icon: Package },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-hairline p-5 flex flex-col gap-1',
        accent ? 'bg-brand-primary text-white' : 'bg-canvas'
      )}
    >
      <p className={cn('font-body text-xs', accent ? 'text-white/70' : 'text-ink-muted')}>{label}</p>
      <p className={cn('font-sans font-extrabold text-3xl', accent ? 'text-white' : 'text-ink')}>{value}</p>
      {sub && (
        <p className={cn('font-body text-xs', accent ? 'text-white/60' : 'text-ink-muted')}>{sub}</p>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-body font-medium px-2.5 py-1 rounded-full',
        meta.className
      )}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  )
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order
  onClose: () => void
  onStatusChange: (id: string, status: OrderStatus) => void
}) {
  const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'completed', 'declined']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-canvas rounded-[24px] border border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline sticky top-0 bg-canvas z-10">
          <h2 className="font-sans font-bold text-ink text-lg">
            طلب رقم <span className="text-brand-primary">{order.id}</span>
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-1 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-body text-sm text-ink-muted">الحالة الحالية:</span>
            <StatusBadge status={order.status} />
          </div>

          {/* Customer Info */}
          <div className="bg-surface-1 rounded-[20px] p-4 space-y-3">
            <h3 className="font-sans font-bold text-ink text-sm">بيانات العميل</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-sans font-bold text-brand-primary text-xs">
                    {order.customerName.charAt(0)}
                  </span>
                </div>
                <span className="font-body text-sm text-ink">{order.customerName}</span>
              </div>
              <a
                href={`tel:${order.phone}`}
                className="flex items-center gap-2 font-body text-sm text-brand-primary hover:underline"
              >
                <Phone className="w-4 h-4" />
                {order.phone}
              </a>
              {order.deliveryMethod === 'shipping' && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-ink-muted mt-0.5 shrink-0" />
                  <span className="font-body text-sm text-ink-muted">
                    {order.address}، {order.governorate}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-ink-muted bg-surface-2 px-2 py-0.5 rounded-md">
                  {order.deliveryMethod === 'pickup' ? 'استلام من المتجر' : 'شحن للمنزل'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-sans font-bold text-ink text-sm mb-3">المنتجات</h3>
            <div className="space-y-3">
              {order.items.map(item => {
                const product = MOCK_PRODUCTS.find(p => p.id === item.productId)
                return (
                  <div key={item.productId} className="flex gap-3 bg-surface-1 rounded-[16px] p-3 items-center">
                    {product && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-canvas shrink-0">
                        <Image
                          src={product.photos[0]}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-ink line-clamp-1">{item.name}</p>
                      <p className="font-body text-xs text-ink-muted">× {item.qty}</p>
                    </div>
                    <p className="font-sans font-bold text-sm text-ink shrink-0">
                      {(item.price * item.qty).toLocaleString('ar-EG')} ج.م
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-hairline">
              <span className="font-body text-sm text-ink-muted">الإجمالي</span>
              <span className="font-sans font-bold text-xl text-brand-primary">
                {order.total.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </div>

          {/* Status Actions */}
          <div>
            <h3 className="font-sans font-bold text-ink text-sm mb-3">تغيير الحالة</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.filter(s => s !== order.status).map(s => {
                const meta = STATUS_META[s]
                return (
                  <button
                    key={s}
                    onClick={() => {
                      onStatusChange(order.id, s)
                      onClose()
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-body font-medium border border-hairline hover:shadow-sm transition-all',
                      meta.className
                    )}
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.get_orders()
        setOrders(data)
      } catch (err) {
        console.error('[v0] Failed to fetch orders:', err)
        setError(err instanceof Error ? err.message : 'فشل تحميل الطلبات من الخادم')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const retry = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.get_orders()
      setOrders(data)
    } catch (err) {
      console.error('[v0] Failed to fetch orders:', err)
      setError(err instanceof Error ? err.message : 'فشل تحميل الطلبات من الخادم')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      await api.update_order_status(id, status)
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)))
    } catch (err) {
      console.error('[v0] Failed to update order status:', err)
      alert('فشل تحديث حالة الطلب')
    }
  }

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.includes(search) ||
        o.phone.includes(search)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  if (loading && orders.length === 0) {
    return <div className="text-center py-8 text-ink-muted">جاري تحميل الطلبات...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 border border-red-300 rounded-xl p-6 inline-block max-w-md">
          <p className="font-body text-red-700 mb-4">{error}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg font-body text-sm hover:bg-brand-primary/90 transition-colors"
          >
            إعادة محاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-sans font-bold text-ink text-2xl">الطلبات</h2>
          <p className="font-body text-sm text-ink-muted">{orders.length} طلب إجمالي</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث برقم الطلب، الاسم، أو الهاتف..."
            className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-hairline font-body text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'confirmed', 'shipped', 'completed', 'declined'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-2 rounded-full text-xs font-body font-medium transition-colors',
                statusFilter === s
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-1 text-ink-muted hover:bg-surface-2'
              )}
            >
              {s === 'all' ? 'الكل' : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-canvas border border-hairline rounded-[20px] overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 bg-surface-1 border-b border-hairline text-xs font-body font-semibold text-ink-muted">
          <span>رقم الطلب</span>
          <span>العميل</span>
          <span>المنتجات</span>
          <span>الإجمالي</span>
          <span>الحالة</span>
          <span>إجراء</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-10 h-10 text-ink-muted mx-auto mb-3" />
            <p className="font-body text-ink-muted text-sm">لا توجد طلبات مطابقة</p>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {filtered.map(order => (
              <div
                key={order.id}
                className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 items-center hover:bg-surface-1 transition-colors"
              >
                {/* ID */}
                <span className="font-sans font-bold text-brand-primary text-sm">{order.id}</span>
                {/* Customer */}
                <div>
                  <p className="font-body text-sm text-ink font-semibold">{order.customerName}</p>
                  <p className="font-body text-xs text-ink-muted">{order.phone}</p>
                </div>
                {/* Items */}
                <p className="font-body text-xs text-ink-muted line-clamp-1">
                  {order.items.map(i => `${i.name} (×${i.qty})`).join('، ')}
                </p>
                {/* Total */}
                <span className="font-sans font-bold text-sm text-ink">
                  {order.total.toLocaleString('ar-EG')} ج.م
                </span>
                {/* Status */}
                <StatusBadge status={order.status} />
                {/* Action */}
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center gap-1 text-xs font-body text-brand-primary hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" />
                  عرض
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={orders.find(o => o.id === selectedOrder.id)!}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateStatus}
        />
      )}
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.get_dashboard_stats()
        setStats(data)
      } catch (err) {
        console.error('[v0] Failed to fetch dashboard stats:', err)
        setError(err instanceof Error ? err.message : 'فشل تحميل البيانات من الخادم')
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true)
        const data = await api.get_products()
        setProducts(data)
      } catch (err) {
        console.error('[v0] Failed to fetch products:', err)
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-ink-muted">جاري تحميل لوحة التحكم...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 border border-red-300 rounded-xl p-6 inline-block max-w-md">
          <p className="font-body text-red-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              setError('')
              api.get_dashboard_stats()
                .then(data => setStats(data))
                .catch(err => {
                  console.error('[v0] Retry failed:', err)
                  setError(err instanceof Error ? err.message : 'فشل تحميل البيانات')
                })
                .finally(() => setLoading(false))
            }}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg font-body text-sm hover:bg-brand-primary/90 transition-colors"
          >
            إعادة محاولة
          </button>
        </div>
      </div>
    )
  }

  const stats_ = stats || {
    totalRevenue: 0,
    totalOrders: 0,
    ordersByStatus: { pending: 0, confirmed: 0, declined: 0, shipped: 0, completed: 0 },
    recentOrders: [],
    totalProducts: 0,
  }

  return (
    <div>
      <h2 className="font-sans font-bold text-ink text-2xl mb-6">لوحة التحكم</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="إجمالي الإيرادات"
          value={`${(stats_.totalRevenue / 1000).toFixed(0)}K`}
          sub="ج.م"
          accent
        />
        <StatCard label="إجمالي الطلبات" value={stats_.totalOrders} sub="طلب" />
        <StatCard label="قيد الانتظار" value={stats_.ordersByStatus.pending} sub="طلب جديد" />
        <StatCard label="تم الشحن" value={stats_.ordersByStatus.shipped} sub="في الطريق" />
      </div>

      {/* Recent orders */}
      <div className="bg-canvas border border-hairline rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <h3 className="font-sans font-bold text-ink">أحدث الطلبات</h3>
        </div>
        <div className="divide-y divide-hairline">
          {(stats_.recentOrders || []).slice(0, 5).map((order: any) => (
            <div key={order.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans font-bold text-brand-primary text-sm">{order.id}</span>
                  <span className="font-body text-sm text-ink">{order.customerName}</span>
                </div>
                <p className="font-body text-xs text-ink-muted line-clamp-1 mt-0.5">
                  {order.items.map((i: any) => i.name).join('، ')}
                </p>
              </div>
              <StatusBadge status={order.status} />
              <span className="font-sans font-bold text-sm text-ink shrink-0">
                {order.total.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Products overview */}
      <div className="mt-6 bg-canvas border border-hairline rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <h3 className="font-sans font-bold text-ink">المنتجات المتوفرة</h3>
          <span className="font-body text-xs text-ink-muted">
            {products.filter((p: any) => p.stockStatus === 'in_stock').length} متوفر
          </span>
        </div>
        {productsLoading ? (
          <div className="py-8 text-center text-ink-muted">جاري تحميل المنتجات...</div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-ink-muted">لا توجد منتجات</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {products.slice(0, 6).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 bg-surface-1 rounded-[16px] p-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-canvas shrink-0">
                  <Image
                    src={p.photos[0]}
                    alt={p.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs font-semibold text-ink line-clamp-1">{p.name}</p>
                  <p className="font-sans font-bold text-xs text-brand-primary">
                    {p.price.toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
                <span
                  className={cn(
                    'text-xs font-body px-2 py-0.5 rounded-full shrink-0',
                    p.stockStatus === 'in_stock'
                      ? 'bg-green-100 text-green-700'
                      : p.stockStatus === 'limited'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-600'
                  )}
                >
                  {p.stockStatus === 'in_stock' ? 'متوفر' : p.stockStatus === 'limited' ? 'محدود' : 'نفد'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'pricelist' | 'settings'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await api.logout()
      router.refresh()
    } catch (err) {
      console.error('[v0] Logout error:', err)
      router.refresh()
    }
  }

  const SidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <Image
          src="/logo.jpeg"
          alt="الحسين للاب توب"
          width={36}
          height={36}
          className="rounded-xl object-cover"
        />
        <div>
          <p className="font-sans font-bold text-white text-sm leading-tight">الحسين للاب توب</p>
          <p className="font-body text-xs text-white/50">لوحة الإدارة</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as typeof activeTab)
                setSidebarOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-body text-sm transition-colors text-start',
                activeTab === item.id
                  ? 'bg-brand-primary text-white font-semibold'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <Link
          href="/"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-body text-sm text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          عرض المتجر
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-body text-sm text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen bg-surface-1 overflow-hidden font-body">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-inverse-canvas shrink-0">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-inverse-canvas">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-hairline bg-canvas flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-full hover:bg-surface-1 transition-colors"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5 text-ink" />
            </button>
            <h1 className="font-sans font-bold text-ink text-base">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? 'الإدارة'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
              <span className="font-sans font-bold text-white text-xs">م</span>
            </div>
            <span className="hidden sm:block font-body text-sm text-ink">المسؤول</span>
          </div>
        </header>

        {/* Content */}
  <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'pricelist' && <PricelistTab />}
        {activeTab === 'settings' && (
            <div>
              <h2 className="font-sans font-bold text-ink text-2xl mb-6">الإعدادات</h2>
              <div className="bg-canvas border border-hairline rounded-[20px] p-8 text-center">
                <Settings className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                <p className="font-body text-ink-muted text-sm">صفحة الإعدادات قيد التطوير.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
