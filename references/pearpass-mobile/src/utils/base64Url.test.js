import {
  uint8ArrayToBase64Url,
  base64UrlToUint8Array,
  objectToBase64Url,
  base64UrlToObject
} from './base64Url'

describe('base64Url', () => {
  describe('uint8ArrayToBase64Url', () => {
    test('should encode a simple Uint8Array to base64url', () => {
      const input = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = uint8ArrayToBase64Url(input)
      expect(result).toBe('SGVsbG8')
    })

    test('should replace + with -', () => {
      const input = new Uint8Array([255, 239]) // Will contain + in base64
      const result = uint8ArrayToBase64Url(input)
      expect(result).not.toContain('+')
      expect(result).toContain('-')
    })

    test('should replace / with _', () => {
      const input = new Uint8Array([255, 255]) // Will contain / in base64
      const result = uint8ArrayToBase64Url(input)
      expect(result).not.toContain('/')
      expect(result).toContain('_')
    })

    test('should remove padding =', () => {
      const input = new Uint8Array([72]) // Single byte will have padding
      const result = uint8ArrayToBase64Url(input)
      expect(result).not.toContain('=')
    })

    test('should handle empty Uint8Array', () => {
      const input = new Uint8Array([])
      const result = uint8ArrayToBase64Url(input)
      expect(result).toBe('')
    })
  })

  describe('base64UrlToUint8Array', () => {
    test('should decode a simple base64url to Uint8Array', () => {
      const input = 'SGVsbG8'
      const result = base64UrlToUint8Array(input)
      const expected = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      expect(result).toEqual(expected)
    })

    test('should replace - with +', () => {
      const input = 'SGVs-bG8'
      const result = base64UrlToUint8Array(input)
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    test('should replace _ with /', () => {
      const input = 'SGVs_bG8'
      const result = base64UrlToUint8Array(input)
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    test('should add proper padding', () => {
      const input = 'SGVsbG8' // No padding needed
      const result = base64UrlToUint8Array(input)
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
    })

    test('should handle empty string', () => {
      const input = ''
      const result = base64UrlToUint8Array(input)
      expect(result).toEqual(new Uint8Array([]))
    })

    test('should be reversible with uint8ArrayToBase64Url', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253])
      const encoded = uint8ArrayToBase64Url(original)
      const decoded = base64UrlToUint8Array(encoded)
      expect(decoded).toEqual(original)
    })
  })

  describe('objectToBase64Url', () => {
    test('should encode a simple object to base64url', () => {
      const obj = { message: 'Hello' }
      const result = objectToBase64Url(obj)
      expect(typeof result).toBe('string')
      expect(result).not.toContain('+')
      expect(result).not.toContain('/')
      expect(result).not.toContain('=')
    })

    test('should encode complex objects', () => {
      const obj = {
        name: 'Test',
        age: 25,
        active: true,
        tags: ['a', 'b', 'c'],
        nested: { level: 2 }
      }
      const result = objectToBase64Url(obj)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    test('should handle empty object', () => {
      const obj = {}
      const result = objectToBase64Url(obj)
      expect(typeof result).toBe('string')
      // Empty object {} stringifies to "{}"
      const decoded = base64UrlToObject(result)
      expect(decoded).toEqual({})
    })

    test('should handle null values', () => {
      const obj = { value: null }
      const result = objectToBase64Url(obj)
      const decoded = base64UrlToObject(result)
      expect(decoded).toEqual({ value: null })
    })

    test('should handle arrays', () => {
      const obj = [1, 2, 3, 'test']
      const result = objectToBase64Url(obj)
      const decoded = base64UrlToObject(result)
      expect(decoded).toEqual([1, 2, 3, 'test'])
    })
  })

  describe('base64UrlToObject', () => {
    test('should decode a base64url to object', () => {
      const encoded = objectToBase64Url({ message: 'Hello' })
      const result = base64UrlToObject(encoded)
      expect(result).toEqual({ message: 'Hello' })
    })

    test('should decode complex objects', () => {
      const original = {
        name: 'Test',
        age: 25,
        active: true,
        tags: ['a', 'b', 'c'],
        nested: { level: 2 }
      }
      const encoded = objectToBase64Url(original)
      const result = base64UrlToObject(encoded)
      expect(result).toEqual(original)
    })

    test('should be reversible with objectToBase64Url', () => {
      const original = {
        id: 123,
        data: 'test data',
        timestamp: 1234567890,
        flags: { a: true, b: false }
      }
      const encoded = objectToBase64Url(original)
      const decoded = base64UrlToObject(encoded)
      expect(decoded).toEqual(original)
    })

    test('should handle special characters in strings', () => {
      const original = {
        text: 'Special chars: äöü ñ 中文 🎉',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
      }
      const encoded = objectToBase64Url(original)
      const decoded = base64UrlToObject(encoded)
      expect(decoded).toEqual(original)
    })

    test('should throw error for invalid base64url', () => {
      expect(() => {
        base64UrlToObject('invalid!@#$')
      }).toThrow()
    })
  })

  describe('Integration tests', () => {
    test('uint8Array functions should be fully reversible', () => {
      const testCases = [
        new Uint8Array([]),
        new Uint8Array([0]),
        new Uint8Array([255]),
        new Uint8Array([0, 127, 255]),
        new Uint8Array(Array.from({ length: 100 }, (_, i) => i))
      ]

      testCases.forEach((original) => {
        const encoded = uint8ArrayToBase64Url(original)
        const decoded = base64UrlToUint8Array(encoded)
        expect(decoded).toEqual(original)
      })
    })

    test('object functions should be fully reversible', () => {
      const testCases = [
        {},
        { simple: 'value' },
        { number: 42, boolean: true, null: null },
        { nested: { deep: { structure: 'value' } } },
        ['array', 'of', 'values'],
        { mixed: ['array', { in: 'object' }, 123] }
      ]

      testCases.forEach((original) => {
        const encoded = objectToBase64Url(original)
        const decoded = base64UrlToObject(encoded)
        expect(decoded).toEqual(original)
      })
    })
  })
})
