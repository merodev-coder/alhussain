import { api } from '@/lib/api'
import AdminLogin from './admin-login'
import AdminDashboard from './admin-dashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'لوحة الإدارة - الحسين للاب توب',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const session = await api.check_session()

  if (!session.authenticated) {
    return <AdminLogin />
  }

  return <AdminDashboard />
}
