const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const fetcher = async (url: string) => {
  const res = await fetch(`${API_URL}${url}`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'تعذّر تحميل البيانات')
  }
  return res.json()
}
