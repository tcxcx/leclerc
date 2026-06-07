/**
 * @param {Array<{base64: string, id?: string|number, name: string}>} files
 * @returns {Array<{name: string, buffer: Uint8Array, id?: string|number}>}
 */
export const convertBase64FilesToUint8 = (files) =>
  files.map(({ base64, id, name }) => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const result = {
      name,
      buffer: bytes
    }

    if (id !== undefined) {
      result.id = id
    }

    return result
  })
