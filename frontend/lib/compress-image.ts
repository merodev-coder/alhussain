/**
 * Shrinks a photo in the browser before upload.
 * Phone photos are often 3-8 MB; a receipt only needs ~1600px to stay readable,
 * which brings the upload down to a few hundred KB.
 */
export async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.8
): Promise<File> {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
    // Small files are not worth re-encoding
    if (file.size < 300 * 1024) return file

    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    // Any failure -> just upload the original
    return file
  }
}
