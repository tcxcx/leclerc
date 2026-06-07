import { Buffer } from 'buffer'

import { bufferToBase64Uri } from './bufferToBase64Uri'

describe('bufferToBase64Uri', () => {
  it('should convert a buffer to a base64 URI with default mime type', () => {
    // Arrange
    const testBuffer = Buffer.from('test image data')
    const expectedBase64 = Buffer.from('test image data').toString('base64')
    const expectedUri = `data:image/jpeg;base64,${expectedBase64}`

    // Act
    const result = bufferToBase64Uri(testBuffer)

    // Assert
    expect(result).toBe(expectedUri)
  })

  it('should convert a buffer to a base64 URI with custom mime type', () => {
    // Arrange
    const testBuffer = Buffer.from('test png data')
    const expectedBase64 = Buffer.from('test png data').toString('base64')
    const expectedUri = `data:image/png;base64,${expectedBase64}`

    // Act
    const result = bufferToBase64Uri(testBuffer, 'image/png')

    // Assert
    expect(result).toBe(expectedUri)
  })

  it('should handle empty buffer', () => {
    // Arrange
    const testBuffer = Buffer.from('')
    const expectedBase64 = Buffer.from('').toString('base64')
    const expectedUri = `data:image/jpeg;base64,${expectedBase64}`

    // Act
    const result = bufferToBase64Uri(testBuffer)

    // Assert
    expect(result).toBe(expectedUri)
  })
})
