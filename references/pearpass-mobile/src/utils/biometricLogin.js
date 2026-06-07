import * as LocalAuthentication from 'expo-local-authentication'

export const isFacialRecognitionSupported = (supportedTypes) =>
  supportedTypes.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
  )

export const isFingerprintSupported = (supportedTypes) =>
  supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)

export const isBiometricSupported = (type, biometricTypes) =>
  biometricTypes.includes(type)
