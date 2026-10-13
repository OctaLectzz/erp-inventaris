import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const messagesDir = path.resolve(__dirname, '../../messages')
const idDir = path.join(messagesDir, 'id')
const enDir = path.join(messagesDir, 'en')

const expectedNamespaces = ['index.json', 'common.json', 'navigation.json', 'sidebar.json', 'auth.json', 'dashboard.json', 'validation.json']

function getNestedKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getNestedKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function assertNoEmptyValues(obj: Record<string, unknown>, prefix = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      assertNoEmptyValues(value as Record<string, unknown>, fullKey)
    } else if (typeof value === 'string') {
      expect(value.trim().length, `Translation key "${fullKey}" must not be empty`).toBeGreaterThan(0)
    }
  }
}

describe('Internationalization (i18n) Parity & Validity', () => {
  it('should have both id and en directories', () => {
    expect(fs.existsSync(idDir)).toBe(true)
    expect(fs.existsSync(enDir)).toBe(true)
  })

  it('should contain all expected 7 namespace files in both id and en', () => {
    const idFiles = fs.readdirSync(idDir).sort()
    const enFiles = fs.readdirSync(enDir).sort()

    expect(idFiles).toEqual(expectedNamespaces.slice().sort())
    expect(enFiles).toEqual(expectedNamespaces.slice().sort())
  })

  expectedNamespaces.forEach((file) => {
    describe(`Namespace: ${file}`, () => {
      const idPath = path.join(idDir, file)
      const enPath = path.join(enDir, file)

      it(`should contain valid JSON in both locales for ${file}`, () => {
        const idContent = fs.readFileSync(idPath, 'utf-8')
        const enContent = fs.readFileSync(enPath, 'utf-8')

        expect(() => JSON.parse(idContent)).not.toThrow()
        expect(() => JSON.parse(enContent)).not.toThrow()
      })

      it(`should have 1:1 matching keys between id and en for ${file}`, () => {
        const idData = JSON.parse(fs.readFileSync(idPath, 'utf-8'))
        const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'))

        const idKeys = getNestedKeys(idData).sort()
        const enKeys = getNestedKeys(enData).sort()

        expect(idKeys).toEqual(enKeys)
      })

      it(`should not contain empty translation values in id for ${file}`, () => {
        const idData = JSON.parse(fs.readFileSync(idPath, 'utf-8'))
        assertNoEmptyValues(idData)
      })

      it(`should not contain empty translation values in en for ${file}`, () => {
        const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'))
        assertNoEmptyValues(enData)
      })
    })
  })
})
