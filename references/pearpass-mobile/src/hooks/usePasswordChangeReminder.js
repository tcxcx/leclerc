import { useState, useEffect } from 'react'

import * as SecureStore from 'expo-secure-store'

import { SECURE_STORAGE_KEYS } from '../constants/secureStorageKeys'

/**
 * @returns {{
 *   isPasswordChangeReminderEnabled: boolean
 * }} `true` if the password change reminder is enabled, `false` otherwise.
 */

export const usePasswordChangeReminder = () => {
  const [isPasswordChangeReminderEnabled, setIsPasswordChangeReminderEnabled] =
    useState(true)

  useEffect(() => {
    async function getPasswordChangeReminder() {
      const passwordChangeReminder = await SecureStore.getItemAsync(
        SECURE_STORAGE_KEYS.IS_PASSWORD_CHANGE_REMINDER_ENABLED
      )
      setIsPasswordChangeReminderEnabled(passwordChangeReminder !== 'false')
    }
    getPasswordChangeReminder()
  }, [])

  return { isPasswordChangeReminderEnabled }
}
