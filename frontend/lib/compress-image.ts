/**
 * Shrinks a photo in the browser before upload.
 * Phone photos are often 3-8 MB; a receipt or product photo only needs ~1600-1920px
 * to stay sharp, which brings the upload down to a few hundred KB.
 *
 * PNG / WebP inputs (e.g. product shots with transparent backgrounds) are re-encoded
 * as WebP so transparency is preserved; everything else becomes JPEG.
 */
export async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.82
): Promise<File> {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
      return file
    }
    // Small files are not worth re-encoding
    if (file.size < 300 * 1024) return file

    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const keepAlpha = file.type === 'image/png' || file.type === 'image/webp'
    const outType = keepAlpha ? 'image/webp' : 'image/jpeg'

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    if (!keepAlpha) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, outType, quality)
    )
    // Browser could not encode the type, or the result is not smaller -> keep original
    if (!blob || blob.type !== outType || blob.size >= file.size) return file

    const ext = keepAlpha ? 'webp' : 'jpg'
    const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext
    return new File([blob], name, { type: outType })
  } catch {
    // Any failure -> just upload the original
    return file
  }
}
