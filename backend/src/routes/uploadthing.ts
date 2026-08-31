import { createUploadthing, createRouteHandler, type FileRouter } from 'uploadthing/express'
import { UploadThingError } from 'uploadthing/server'
import { getAdminSessionFromRequest } from '../lib/auth.js'
import { getUploadThingTokens } from '../lib/uploadthing-tokens.js'

const f = createUploadthing({
  errorFormatter: (err) => ({
    message: err.message,
    name: err.name,
  }),
})

const uploadRouter = {
  productPhotos: f({ image: { maxFileSize: '8MB', maxFileCount: 8 } })
    .middleware(async ({ req }) => {
      const session = await getAdminSessionFromRequest(req)
      if (!session) throw new UploadThingError('غير مصرح')
      return { by: 'admin' }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  depositPhotos: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof uploadRouter

const tokens = getUploadThingTokens()
const token = tokens[0]

export default createRouteHandler({
  router: uploadRouter,
  config: token ? { token } : undefined,
})
