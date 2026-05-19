/**
 * Resize/compress images before upload to reduce wait time (keeps aspect ratio).
 * Skips non-images and files already under ~400 KB.
 */
const MAX_DIMENSION = 1920
const SKIP_BELOW_BYTES = 400 * 1024
const JPEG_QUALITY = 0.82

export async function compressImageForUpload(file) {
  if (!file || !(file instanceof File)) return file
  if (!file.type.startsWith('image/')) return file
  if (file.size <= SKIP_BELOW_BYTES) return file

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const maxSide = Math.max(img.width, img.height)
      const scale = maxSide > MAX_DIMENSION ? MAX_DIMENSION / maxSide : 1
      const width = Math.max(1, Math.round(img.width * scale))
      const height = Math.max(1, Math.round(img.height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file)
            return
          }
          const baseName = (file.name || 'image').replace(/\.[^.]+$/i, '') || 'image'
          resolve(
            new File([blob], `${baseName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
          )
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}
