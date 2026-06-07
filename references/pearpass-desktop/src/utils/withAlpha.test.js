import { withAlpha } from './withAlpha'

describe('withAlpha', () => {
  it('appends alpha byte to a 6-digit hex color', () => {
    expect(withAlpha('#15180E', 0)).toBe('#15180E00')
    expect(withAlpha('#15180E', 1)).toBe('#15180Eff')
    expect(withAlpha('#15180E', 0.5)).toBe('#15180E80')
  })

  it('clamps alpha into [0, 1]', () => {
    expect(withAlpha('#15180E', -1)).toBe('#15180E00')
    expect(withAlpha('#15180E', 2)).toBe('#15180Eff')
  })

  it('throws on a missing or malformed hex (e.g. unset light-theme token)', () => {
    expect(() => withAlpha('', 0)).toThrow(/expected #RRGGBB/)
    expect(() => withAlpha('#abc', 0)).toThrow(/expected #RRGGBB/)
    expect(() => withAlpha('rgb(0,0,0)', 0)).toThrow(/expected #RRGGBB/)
  })
})
