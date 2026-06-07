const HEX_COLOR = /^#([0-9a-fA-F]{6})$/

export const withAlpha = (hex: string, alpha: number): string => {
  if (!HEX_COLOR.test(hex)) {
    throw new Error(
      `withAlpha: expected #RRGGBB hex color, got "${hex}". ` +
        'Check that the theme token is defined for the current theme.'
    )
  }
  const clamped = Math.max(0, Math.min(1, alpha))
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${byte}`
}
