import { describe, expect, it } from 'vitest'

import { validateImageMagicBytes } from '@/components/shared/image-dropzone'
import { productCatalogInputSchema } from '@/schemas/inventory-schema'

describe('Image Security & Magic Bytes Validation', () => {
  it('correctly recognizes genuine JPEG magic bytes (0xFF, 0xD8, 0xFF)', async () => {
    // Construct mock JPEG header: FF D8 FF E0 ...
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    const file = new File([jpegBytes], 'photo.jpg', { type: 'image/jpeg' })

    const isValid = await validateImageMagicBytes(file)
    expect(isValid).toBe(true)
  })

  it('correctly recognizes genuine PNG magic bytes (0x89, 0x50, 0x4E, 0x47)', async () => {
    // Construct mock PNG header: 89 50 4E 47 0D 0A 1A 0A ...
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    const file = new File([pngBytes], 'graphic.png', { type: 'image/png' })

    const isValid = await validateImageMagicBytes(file)
    expect(isValid).toBe(true)
  })

  it('correctly recognizes genuine WebP magic bytes (RIFF ... WEBP)', async () => {
    // Construct mock WebP header: 'RIFF' .... 'WEBP'
    const webpBytes = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46, // 'RIFF'
      0x24,
      0x00,
      0x00,
      0x00, // length
      0x57,
      0x45,
      0x42,
      0x50 // 'WEBP'
    ])
    const file = new File([webpBytes], 'banner.webp', { type: 'image/webp' })

    const isValid = await validateImageMagicBytes(file)
    expect(isValid).toBe(true)
  })

  it('rejects malicious or corrupt files disguised with image MIME types', async () => {
    // Malicious HTML/script content pretending to be image/jpeg
    const textEncoder = new TextEncoder()
    const htmlPayload = textEncoder.encode('<script>alert("pwned")</script>')
    const spoofedFile = new File([htmlPayload], 'exploit.jpg', { type: 'image/jpeg' })

    const isValid = await validateImageMagicBytes(spoofedFile)
    expect(isValid).toBe(false)
  })

  it('rejects files with mismatched MIME type and header bytes', async () => {
    // PNG bytes sent with image/jpeg MIME type
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const mismatchFile = new File([pngBytes], 'fake.jpg', { type: 'image/jpeg' })

    const isValid = await validateImageMagicBytes(mismatchFile)
    expect(isValid).toBe(false)
  })
})

describe('Image URL Scheme Strict Validation in Catalog Schemas', () => {
  const baseValid = {
    sku: 'SEC-001',
    name: 'Secure Product',
    category: 'Security',
    unit: 'pcs',
    price: 150000
  }

  it('accepts valid https image URLs', () => {
    const result = productCatalogInputSchema.safeParse({
      ...baseValid,
      imageUrl: 'https://cdn.example.com/products/sec-001.jpg'
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid http image URLs for local development', () => {
    const result = productCatalogInputSchema.safeParse({
      ...baseValid,
      imageUrl: 'http://localhost:3000/placeholder.png'
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty string and null for products without image', () => {
    expect(productCatalogInputSchema.safeParse({ ...baseValid, imageUrl: '' }).success).toBe(true)
    expect(productCatalogInputSchema.safeParse({ ...baseValid, imageUrl: null }).success).toBe(true)
    expect(productCatalogInputSchema.safeParse({ ...baseValid, imageUrl: undefined }).success).toBe(true)
  })

  it('rejects javascript: and pseudo-protocol malicious URLs', () => {
    const result = productCatalogInputSchema.safeParse({
      ...baseValid,
      imageUrl: 'javascript:alert(document.cookie)'
    })
    expect(result.success).toBe(false)
  })

  it('rejects data: text/html base64 XSS payload URLs', () => {
    const result = productCatalogInputSchema.safeParse({
      ...baseValid,
      imageUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
    })
    expect(result.success).toBe(false)
  })
})
