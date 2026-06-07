export enum ImportCodesOptionType {
  GoogleAuthenticator = 'google-authenticator',
  Proton2FA = 'proton-2fa'
}

export type CodeFileInfo = {
  fileContent: string
  parsedJson: Record<string, unknown> | null
  isEncrypted: boolean
}

export type ImportCodesState = 'default' | 'upload' | 'inputPassword'

export type ImportCodesOption = {
  type: ImportCodesOptionType
  title: string
  description: string
  learnMoreUrl?: string
  accepts: string[]
  multiFile?: boolean
  testID?: string
}
