import { useCallback } from 'react'

import { useFocusEffect } from '@react-navigation/native'
import { BackHandler } from 'react-native'

/**
 * @typedef {Object} BackHandlerProps
 * @property {() => void} [callback]
 * @property {boolean} [shouldNotGoBack=false]
 * @property {any[]} [dependencyList=[]]
 */

/**
 * @param {BackHandlerProps} props
 * @returns {void}
 */
export const useBackHandler = ({
  callback,
  shouldNotGoBack = false,
  dependencyList = []
}) => {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (shouldNotGoBack) {
          return true
        }

        if (callback) {
          callback()
          return true
        }

        return false
      }

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      )

      return () => subscription.remove()
    }, [shouldNotGoBack, callback, ...dependencyList])
  )
}
