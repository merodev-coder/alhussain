import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { getAdminSession } from '@/lib/auth'

const f = createUploadthing()

export const ourFileRouter = {
  // Admin-only: product gallery photos.
  productPhotos: f({ image: { maxFileSize: '8MB', maxFileCount: 8 } })
    .middleware(async () => {
      const session = await getAdminSession()
      if (!session) throw new UploadThingError('غير مصرح')
      return { by: session.sub }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  // Public: deposit receipt photo uploaded by a guest during checkout.
  depositPhotos: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
