import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'

import { validateBase64Size } from './fileSize'
import { logger } from './logger'

const ALLOWED_MEDIA_TYPES = ['images', 'videos', 'livePhotos']

/**
 * @async
 * @param {Function} onFileSelect
 * @param {Function} validationCallback
 * @param {boolean} [imagesOnly=false]
 * @returns {Promise<void>} A promise that resolves when the file selection process is complete.
 * @throws {Error}
 */
export const handleChooseFile = async (
  onFileSelect,
  validationCallback,
  imagesOnly = false
) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: imagesOnly ? 'image/*' : '*/*',
      copyToCacheDirectory: true,
      multiple: false
    })

    if (result.canceled) return

    const file = result.assets?.[0]
    const response = await fetch(file.uri)
    const blob = await response.blob()

    const base64 = await readBlobAsBase64(blob)

    const validation = validateBase64Size(base64)
    if (!validation.valid) {
      validationCallback?.()
      return
    }

    onFileSelect?.({
      base64: base64,
      name: file.name
    })
  } catch (e) {
    logger.error('Error picking file:', e)
  }
}

/**
 * @async
 * @param {Function} onMediaSelect
 * @param {Function} validationCallback
 * @returns {Promise<void>} A promise that resolves when the image selection process is complete.
 * @throws {Error}
 */
export const handleChooseMedia = async (onMediaSelect, validationCallback) => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ALLOWED_MEDIA_TYPES,
      allowsEditing: false,
      quality: 1
    })

    if (result.canceled) return

    const file = result.assets?.[0]
    const response = await fetch(file.uri)
    const blob = await response.blob()

    const base64 = await readBlobAsBase64(blob)

    const validation = validateBase64Size(base64)
    if (!validation.valid) {
      validationCallback?.()
      return
    }

    onMediaSelect?.({
      base64: base64,
      name: file.fileName
    })
  } catch (e) {
    logger.error('Error picking media:', e)
  }
}

/**
 *
 * @param {Blob} blob
 * @returns {Promise<string>}
 * @throws {Error}
 */
const readBlobAsBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      const base64 = typeof result === 'string' ? result.split(',')[1] : ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
