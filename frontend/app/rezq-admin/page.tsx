import { getAdminSession } from '@/lib/auth'
import AdminLogin from './admin-login'
import AdminDashboard from './admin-dashboard'

export const metadata = {
  title: 'لوحة الإدارة - الحسين للاب توب',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const session = await getAdminSession()

  if (!session) {
    return <AdminLogin />
  }

  return <AdminDashboard />
}
