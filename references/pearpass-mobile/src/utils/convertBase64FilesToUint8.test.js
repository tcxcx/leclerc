import { convertBase64FilesToUint8 } from './convertBase64FilesToUint8'

describe('convertBase64FilesToUint8', () => {
  it('converts a single base64 file to Uint8Array', () => {
    const files = [{ base64: 'SGVsbG8gV29ybGQ=', name: 'test.txt' }]

    const result = convertBase64FilesToUint8(files)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('test.txt')
    expect(result[0].buffer).toBeInstanceOf(Uint8Array)
    expect(result[0].buffer.length).toBe(11)

    const textDecoder = new TextDecoder()
    expect(textDecoder.decode(result[0].buffer)).toBe('Hello World')
  })

  it('handles multiple files', () => {
    const files = [
      { base64: 'SGVsbG8=', name: 'hello.txt' },
      { base64: 'V29ybGQ=', name: 'world.txt' }
    ]

    const result = convertBase64FilesToUint8(files)

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('hello.txt')
    expect(result[1].name).toBe('world.txt')

    const textDecoder = new TextDecoder()
    expect(textDecoder.decode(result[0].buffer)).toBe('Hello')
    expect(textDecoder.decode(result[1].buffer)).toBe('World')
  })

  it('preserves id when provided', () => {
    const files = [
      { base64: 'SGVsbG8=', id: 1, name: 'hello.txt' },
      { base64: 'V29ybGQ=', id: 'file2', name: 'world.txt' }
    ]

    const result = convertBase64FilesToUint8(files)

    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe('file2')
  })

  it('handles empty array', () => {
    const files = []

    const result = convertBase64FilesToUint8(files)

    expect(result).toEqual([])
  })

  it('omits id when undefined', () => {
    const files = [{ base64: 'SGVsbG8=', name: 'hello.txt' }]

    const result = convertBase64FilesToUint8(files)

    expect(result[0]).not.toHaveProperty('id')
  })
})
