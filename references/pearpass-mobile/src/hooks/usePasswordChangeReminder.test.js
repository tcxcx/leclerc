import { renderHook, waitFor } from '@testing-library/react-native'

import { usePasswordChangeReminder } from './usePasswordChangeReminder'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn()
}))

describe('usePasswordChangeReminder', () => {
  const { getItemAsync } = jest.requireMock('expo-secure-store')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns false when SecureStore returns 'false'", async () => {
    getItemAsync.mockResolvedValueOnce('false')

    const { result } = renderHook(() => usePasswordChangeReminder())

    await waitFor(() => {
      expect(result.current.isPasswordChangeReminderEnabled).toBe(false)
    })
  })

  it('defaults to true when SecureStore returns null', async () => {
    getItemAsync.mockResolvedValueOnce(null)

    const { result } = renderHook(() => usePasswordChangeReminder())

    await waitFor(() => {
      expect(result.current.isPasswordChangeReminderEnabled).toBe(true)
    })
  })
})
