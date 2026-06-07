import { Dimensions } from 'react-native'

jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn().mockReturnValue({ height: 932 })
  }
}))

describe('normalize function', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('returns the same size when window height equals 932 (scale=1)', () => {
    Dimensions.get.mockReturnValue({ height: 932 })
    const { normalize } = require('./normalize')
    const size = 10
    expect(normalize(size)).toBe(10)
  })

  it('scales the size correctly when window height is different', () => {
    jest.resetModules()
    const rn = require('react-native')
    rn.Dimensions.get.mockReturnValue({ height: 1864 })
    const { normalize } = require('./normalize')
    const size = 10
    const expected = size * (1864 / 932)
    expect(normalize(size)).toBe(expected)
  })
})
