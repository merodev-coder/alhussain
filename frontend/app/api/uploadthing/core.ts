import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { headers } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function checkAdminSessionServerSide(): Promise<{ authenticated: boolean; sub?: string }> {
  try {
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie') || ''

    const response = await fetch(`${API_URL}/admin/session`, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
      },
    })

    if (!response.ok) {
      return { authenticated: false }
    }

    return response.json()
  } catch (error) {
    // Session check failed silently
    return { authenticated: false }
  }
}

// Create UploadThing instance with server-side token (not exposed to browser)
const f = createUploadthing({
  token: process.env.UPLOADTHING_TOKEN || '',
})

export const ourFileRouter = {
  // Admin-only: product gallery photos.
  productPhotos: f({ image: { maxFileSize: '8MB', maxFileCount: 8 } })
    .middleware(async () => {
      const session = await checkAdminSessionServerSide()
      if (!session.authenticated) throw new UploadThingError('غير مصرح')
      return { by: 'admin' }
    })
    .onUploadComplete(async ({ file }: { file: { ufsUrl: string } }) => {
      return { url: file.ufsUrl }
    }),

  // Public: deposit receipt photo uploaded by a guest during checkout.
  depositPhotos: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }: { file: { ufsUrl: string } }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
