import { NativeModules, Platform } from 'react-native'

import { logger } from './logger'

const { AppGroupHelper } = NativeModules

export const getSharedDirectoryPath = async () => {
  if (Platform.OS !== 'ios' || !AppGroupHelper) {
    return null
  }

  try {
    const path = await AppGroupHelper.getSharedDirectoryPath()
    logger.log('App Group Helper returned path:', path)
    return path
  } catch (error) {
    logger.warn('Failed to get App Group directory:', error)
    return null
  }
}
