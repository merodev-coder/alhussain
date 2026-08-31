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

// Create UploadThing instance with primary token
// LIMITATION: The file router is bound to this specific uploader instance at module definition time.
// Middleware functions run per-request but cannot swap out the underlying uploader instance.
// Therefore, per-request database reads to select different uploaders do not actually change which token is used.
// Manual token rotation requires changing the environment variable and redeploying/restarting the frontend.
// UploadThing automatically reads the token from UPLOADTHING_TOKEN environment variable
const f = createUploadthing({
  errorFormatter: (err) => {
    return {
      message: err.message,
      name: err.name,
    }
  },
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
