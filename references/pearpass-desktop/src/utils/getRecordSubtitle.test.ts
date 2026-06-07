import { getRecordSubtitle } from './getRecordSubtitle'

describe('getRecordSubtitle', () => {
  it('returns empty string when no matching fields present', () => {
    expect(getRecordSubtitle({})).toBe('')
    expect(getRecordSubtitle({ data: {} })).toBe('')
  })

  it('prefers username over other fields', () => {
    expect(
      getRecordSubtitle({
        data: {
          username: 'alice',
          email: 'alice@example.com',
          name: 'Alice'
        }
      })
    ).toBe('alice')
  })

  it('falls back through email, name, fullName in order', () => {
    expect(
      getRecordSubtitle({
        data: { email: 'alice@example.com', name: 'Alice', fullName: 'A.' }
      })
    ).toBe('alice@example.com')
    expect(
      getRecordSubtitle({ data: { name: 'Alice', fullName: 'A.' } })
    ).toBe('Alice')
    expect(getRecordSubtitle({ data: { fullName: 'A.' } })).toBe('A.')
  })

  it('ignores non-string values', () => {
    expect(
      getRecordSubtitle({
        data: { username: 123 as unknown as string, email: 'ok@x.com' }
      })
    ).toBe('ok@x.com')
  })
})
