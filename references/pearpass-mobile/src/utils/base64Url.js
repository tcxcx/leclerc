/**
 * Encode a Uint8Array to base64url string
 * @param {Uint8Array} uint8Array - The data to encode
 * @returns {string} The base64url encoded string
 */
export const uint8ArrayToBase64Url = (uint8Array) => {
  const base64 = btoa(String.fromCharCode(...uint8Array))

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decode a base64url string to Uint8Array
 * @param {string} base64url - The base64url encoded string
 * @returns {Uint8Array} The decoded data
 */
export const base64UrlToUint8Array = (base64url) => {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')

  const padding = base64.length % 4
  if (padding) {
    base64 += '='.repeat(4 - padding)
  }

  const binaryString = atob(base64)
  const uint8Array = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }

  return uint8Array
}

/**
 * Encode an object to base64url string
 * @param {Object} obj - The object to encode
 * @returns {string} The base64url encoded string
 */
export const objectToBase64Url = (obj) => {
  const json = JSON.stringify(obj)
  const encoder = new TextEncoder()
  const uint8Array = encoder.encode(json)
  return uint8ArrayToBase64Url(uint8Array)
}

/**
 * Decode a base64url string to an object
 * @param {string} base64url - The base64url encoded string
 * @returns {Object} The decoded object
 */
export const base64UrlToObject = (base64url) => {
  const uint8Array = base64UrlToUint8Array(base64url)
  const decoder = new TextDecoder()
  const json = decoder.decode(uint8Array)
  return JSON.parse(json)
}
