import AdminPageClient from './admin-page-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'لوحة الإدارة - الحسين للاب توب',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminPageClient />
}
