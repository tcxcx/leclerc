import { detectIsCodeFileEncrypted, parseCodeJsonContent } from './utils'
import { ImportCodesOptionType } from './types'

describe('parseCodeJsonContent', () => {
  it('returns a plain object for valid JSON objects', () => {
    const result = parseCodeJsonContent('{"version":1,"entries":[]}')
    expect(result).toEqual({ version: 1, entries: [] })
  })

  it('returns null for JSON arrays', () => {
    expect(parseCodeJsonContent('[1,2,3]')).toBeNull()
  })

  it('returns null for JSON primitives', () => {
    expect(parseCodeJsonContent('"hello"')).toBeNull()
    expect(parseCodeJsonContent('42')).toBeNull()
    expect(parseCodeJsonContent('true')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseCodeJsonContent('not valid json')).toBeNull()
    expect(parseCodeJsonContent('')).toBeNull()
  })
})

describe('detectIsCodeFileEncrypted', () => {
  describe('proton-2fa', () => {
    it('returns true for encrypted format (salt + content present)', () => {
      const parsedJson = { version: 1, salt: 'abc123', content: 'encrypted' }
      expect(
        detectIsCodeFileEncrypted(ImportCodesOptionType.Proton2FA, parsedJson)
      ).toBe(true)
    })

    it('returns false for unencrypted format (entries array)', () => {
      const parsedJson = { version: 1, entries: [] }
      expect(
        detectIsCodeFileEncrypted(ImportCodesOptionType.Proton2FA, parsedJson)
      ).toBe(false)
    })

    it('returns false when salt is empty', () => {
      const parsedJson = { version: 1, salt: '', content: 'encrypted' }
      expect(
        detectIsCodeFileEncrypted(ImportCodesOptionType.Proton2FA, parsedJson)
      ).toBe(false)
    })

    it('returns false when content is empty', () => {
      const parsedJson = { version: 1, salt: 'abc123', content: '' }
      expect(
        detectIsCodeFileEncrypted(ImportCodesOptionType.Proton2FA, parsedJson)
      ).toBe(false)
    })

    it('returns false when salt is missing', () => {
      const parsedJson = { version: 1, content: 'encrypted' }
      expect(
        detectIsCodeFileEncrypted(ImportCodesOptionType.Proton2FA, parsedJson)
      ).toBe(false)
    })

    it('returns false when content is missing', () => {
      const parsedJson = { version: 1, salt: 'abc123' }
      expect(
        detectIsCodeFileEncrypted(ImportCodesOptionType.Proton2FA, parsedJson)
      ).toBe(false)
    })

    it('returns false when parsedJson is null', () => {
      expect(
        detectIsCodeFileEncrypted(ImportCodesOptionType.Proton2FA, null)
      ).toBe(false)
    })
  })

  describe('google-authenticator', () => {
    it('always returns false regardless of parsedJson', () => {
      expect(
        detectIsCodeFileEncrypted(ImportCodesOptionType.GoogleAuthenticator, {
          salt: 'abc',
          content: 'xyz'
        })
      ).toBe(false)
      expect(
        detectIsCodeFileEncrypted(
          ImportCodesOptionType.GoogleAuthenticator,
          null
        )
      ).toBe(false)
    })
  })
})
