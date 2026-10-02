import { authHeaders } from '@/lib/admin-token'
import { compressImage } from '@/lib/compress-image'
import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const uploadThingConfig = {
  url: `${API_URL}/api/uploadthing`,
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (href.startsWith(API_URL)) {
      return fetch(input, {
        ...init,
        credentials: 'include',
        headers: { ...(init?.headers as Record<string, string> | undefined), ...authHeaders() },
      })
    }
    return fetch(input, init)
  },
}

const helpers = generateReactHelpers(uploadThingConfig)

export const uploadFiles = helpers.uploadFiles

// Same API as the library hook, but every image is shrunk in the browser first.
// This keeps product/hero/category photos light so the storefront loads fast
// (the site serves uploaded images as-is, so file size = download size).
export const useUploadThing = ((endpoint: any, opts?: any) => {
  const result: any = (helpers.useUploadThing as any)(endpoint, opts)
  const startUpload = async (files: File[], input?: any) => {
    const compressed = await Promise.all(files.map(f => compressImage(f, 1920)))
    return result.startUpload(compressed, input)
  }
  return { ...result, startUpload }
}) as typeof helpers.useUploadThing

export const UploadButton = generateUploadButton(uploadThingConfig)
export const UploadDropzone = generateUploadDropzone(uploadThingConfig)
