import { Buffer } from 'buffer'

/**
 * @param {Buffer} buffer
 * @param {string} [mimeType='image/jpeg']
 * @returns {string}
 */
export const bufferToBase64Uri = (buffer, mimeType = 'image/jpeg') => {
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:${mimeType};base64,${base64}`
}
