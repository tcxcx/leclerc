jest.mock('expo-local-authentication', () => ({
  AuthenticationType: {
    FACIAL_RECOGNITION: 1,
    FINGERPRINT: 2
  }
}))

import * as LocalAuthentication from 'expo-local-authentication'

import {
  isFacialRecognitionSupported,
  isFingerprintSupported,
  isBiometricSupported
} from './biometricLogin'

describe('biometricLogin utils', () => {
  describe('isFacialRecognitionSupported', () => {
    it('returns true when facial recognition is in supported types', () => {
      const supported = [
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      ]
      expect(isFacialRecognitionSupported(supported)).toBe(true)
    })

    it('returns false when facial recognition is not in supported types', () => {
      const supported = [LocalAuthentication.AuthenticationType.FINGERPRINT]
      expect(isFacialRecognitionSupported(supported)).toBe(false)
    })
  })

  describe('isFingerprintSupported', () => {
    it('returns true when fingerprint is in supported types', () => {
      const supported = [LocalAuthentication.AuthenticationType.FINGERPRINT]
      expect(isFingerprintSupported(supported)).toBe(true)
    })

    it('returns false when fingerprint is not in supported types', () => {
      const supported = [
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      ]
      expect(isFingerprintSupported(supported)).toBe(false)
    })
  })

  describe('isBiometricSupported', () => {
    const supportedBoth = [
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      LocalAuthentication.AuthenticationType.FINGERPRINT
    ]

    it('returns true for facialRecognition when supported', () => {
      expect(
        isBiometricSupported(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          supportedBoth
        )
      ).toBe(true)
    })

    it('returns true for fingerprint when supported', () => {
      expect(
        isBiometricSupported(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
          supportedBoth
        )
      ).toBe(true)
    })

    it('returns false for unsupported type', () => {
      const supported = [LocalAuthentication.AuthenticationType.FINGERPRINT]
      expect(
        isBiometricSupported(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          supported
        )
      ).toBe(false)
    })

    it('returns false for unknown option', () => {
      const supported = [LocalAuthentication.AuthenticationType.FINGERPRINT]
      expect(isBiometricSupported(999, supported)).toBe(false)
    })
  })
})
