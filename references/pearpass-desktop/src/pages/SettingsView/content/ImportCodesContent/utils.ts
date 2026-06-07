import { ImportCodesOptionType } from './types'

export type { CodeFileInfo } from './types'

export const parseCodeJsonContent = (
  fileContent: string
): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(fileContent)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

export const detectIsCodeFileEncrypted = (
  type: ImportCodesOptionType,
  parsedJson: Record<string, unknown> | null
): boolean => {
  if (!parsedJson) return false
  switch (type) {
    case ImportCodesOptionType.Proton2FA:
      return (
        typeof parsedJson.salt === 'string' &&
        parsedJson.salt.length > 0 &&
        typeof parsedJson.content === 'string' &&
        parsedJson.content.length > 0
      )
    default:
      return false
  }
}
