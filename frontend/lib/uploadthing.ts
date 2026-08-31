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
      return fetch(input, { ...init, credentials: 'include' })
    }
    return fetch(input, init)
  },
}

export const { useUploadThing, uploadFiles } = generateReactHelpers(uploadThingConfig)

export const UploadButton = generateUploadButton(uploadThingConfig)
export const UploadDropzone = generateUploadDropzone(uploadThingConfig)
