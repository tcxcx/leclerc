// Mock logger first
jest.mock('./logger', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn()
  }
}))

// Mock React Native
jest.mock('react-native', () => ({
  NativeModules: {
    AutofillModule: {
      isAutofillEnabled: jest.fn(),
      openAutofillSettings: jest.fn(),
      requestToEnableAutofill: jest.fn()
    }
  },
  Platform: {
    OS: 'ios',
    select: (objs) => objs.ios
  }
}))

const { NativeModules } = require('react-native')

const {
  isAutofillEnabled,
  openAutofillSettings,
  requestToEnableAutofill
} = require('./AutofillModule')
const { logger } = require('./logger')

describe('AutofillModule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isAutofillEnabled', () => {
    test('should return true when autofill is enabled', async () => {
      NativeModules.AutofillModule.isAutofillEnabled.mockResolvedValueOnce(true)

      const result = await isAutofillEnabled()

      expect(result).toBe(true)
      expect(
        NativeModules.AutofillModule.isAutofillEnabled
      ).toHaveBeenCalledTimes(1)
      // No debug logging for successful status check in current implementation
    })

    test('should return false when autofill is disabled', async () => {
      NativeModules.AutofillModule.isAutofillEnabled.mockResolvedValueOnce(
        false
      )

      const result = await isAutofillEnabled()

      expect(result).toBe(false)
      expect(
        NativeModules.AutofillModule.isAutofillEnabled
      ).toHaveBeenCalledTimes(1)
      // No debug logging for successful status check in current implementation
    })

    test('should return false when native module throws an error', async () => {
      const mockError = new Error('Failed to check status')
      NativeModules.AutofillModule.isAutofillEnabled.mockRejectedValueOnce(
        mockError
      )

      const result = await isAutofillEnabled()

      expect(result).toBe(false)
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to check autofill status:',
        mockError
      )
    })

    test('should return false when AutofillModule is not available', async () => {
      const originalMock = NativeModules.AutofillModule
      NativeModules.AutofillModule = null

      const result = await isAutofillEnabled()

      expect(result).toBe(false)
      expect(logger.error).toHaveBeenCalledWith('AutofillModule not available')

      NativeModules.AutofillModule = originalMock
    })
  })

  describe('openAutofillSettings', () => {
    test('should return true when successful', async () => {
      NativeModules.AutofillModule.openAutofillSettings.mockResolvedValueOnce(
        true
      )

      const result = await openAutofillSettings()

      expect(result).toBe(true)
      expect(
        NativeModules.AutofillModule.openAutofillSettings
      ).toHaveBeenCalledTimes(1)
      // No debug logging for successful settings open in current implementation
    })

    test('should return false when native module throws an error', async () => {
      const mockError = new Error('iOS version not supported')
      NativeModules.AutofillModule.openAutofillSettings.mockRejectedValueOnce(
        mockError
      )

      const result = await openAutofillSettings()

      expect(result).toBe(false)
      expect(
        NativeModules.AutofillModule.openAutofillSettings
      ).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to open autofill settings:',
        mockError
      )
    })

    test('should return false when AutofillModule is not available', async () => {
      const originalMock = NativeModules.AutofillModule
      NativeModules.AutofillModule = null

      const result = await openAutofillSettings()

      expect(result).toBe(false)
      expect(logger.error).toHaveBeenCalledWith('AutofillModule not available')

      NativeModules.AutofillModule = originalMock
    })
  })

  describe('requestToEnableAutofill', () => {
    test('should return true when user enables autofill', async () => {
      NativeModules.AutofillModule.requestToEnableAutofill.mockResolvedValueOnce(
        true
      )

      const result = await requestToEnableAutofill()

      expect(result).toBe(true)
      expect(
        NativeModules.AutofillModule.requestToEnableAutofill
      ).toHaveBeenCalledTimes(1)
      // No debug logging for successful enable request in current implementation
    })

    test('should return false when user cancels or declines', async () => {
      NativeModules.AutofillModule.requestToEnableAutofill.mockResolvedValueOnce(
        false
      )

      const result = await requestToEnableAutofill()

      expect(result).toBe(false)
      expect(
        NativeModules.AutofillModule.requestToEnableAutofill
      ).toHaveBeenCalledTimes(1)
      // No debug logging for successful enable request in current implementation
    })

    test('should return false when native module throws an error', async () => {
      const mockError = new Error('iOS 18+ required')
      NativeModules.AutofillModule.requestToEnableAutofill.mockRejectedValueOnce(
        mockError
      )

      const result = await requestToEnableAutofill()

      expect(result).toBe(false)
      expect(
        NativeModules.AutofillModule.requestToEnableAutofill
      ).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to request autofill enable:',
        mockError
      )
    })

    test('should return false when AutofillModule is not available', async () => {
      const originalMock = NativeModules.AutofillModule
      NativeModules.AutofillModule = null

      const result = await requestToEnableAutofill()

      expect(result).toBe(false)
      expect(logger.error).toHaveBeenCalledWith('AutofillModule not available')

      NativeModules.AutofillModule = originalMock
    })
  })
})
