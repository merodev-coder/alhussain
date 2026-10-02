import type { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alhussain-laptops.vercel.app').replace(/\/$/, '')
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages: MetadataRoute.Sitemap = ['', '/laptops', '/accessories', '/about', '/price-list'].map(path => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  // Add every visible laptop page (best effort - sitemap still works if the API is asleep)
  try {
    const res = await fetch(`${API_URL}/api/products?limit=100`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      const items: { id: string; visible?: boolean }[] = Array.isArray(data) ? data : data.items || []
      for (const p of items) {
        if (p.visible === false) continue
        pages.push({
          url: `${SITE_URL}/laptops/${p.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }
  } catch {
    /* ignore */
  }
  return pages
}
