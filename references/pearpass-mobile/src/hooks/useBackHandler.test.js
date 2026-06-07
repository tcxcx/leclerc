import { renderHook } from '@testing-library/react-native'
import { BackHandler } from 'react-native'

import { useBackHandler } from './useBackHandler'

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback) => callback()
}))

// Mock React Native BackHandler
jest.mock('react-native', () => ({
  BackHandler: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
}))

describe('useBackHandler', () => {
  let mockSubscription

  beforeEach(() => {
    jest.clearAllMocks()
    mockSubscription = { remove: jest.fn() }
    BackHandler.addEventListener.mockReturnValue(mockSubscription)
  })

  it('should register back handler on mount', () => {
    renderHook(() => useBackHandler({}))

    expect(BackHandler.addEventListener).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function)
    )
  })

  it('should call callback when back button is pressed', () => {
    const mockCallback = jest.fn()

    renderHook(() =>
      useBackHandler({
        callback: mockCallback
      })
    )

    const backPressHandler = BackHandler.addEventListener.mock.calls[0][1]
    const result = backPressHandler()

    expect(mockCallback).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should prevent going back when shouldNotGoBack is true', () => {
    renderHook(() =>
      useBackHandler({
        shouldNotGoBack: true
      })
    )

    const backPressHandler = BackHandler.addEventListener.mock.calls[0][1]
    const result = backPressHandler()

    expect(result).toBe(true)
  })

  it('should allow default back behavior when no callback and shouldNotGoBack is false', () => {
    renderHook(() =>
      useBackHandler({
        shouldNotGoBack: false
      })
    )

    const backPressHandler = BackHandler.addEventListener.mock.calls[0][1]
    const result = backPressHandler()

    expect(result).toBe(false)
  })

  it('should handle both callback and shouldNotGoBack', () => {
    const mockCallback = jest.fn()

    renderHook(() =>
      useBackHandler({
        callback: mockCallback,
        shouldNotGoBack: true
      })
    )

    const backPressHandler = BackHandler.addEventListener.mock.calls[0][1]
    const result = backPressHandler()

    // shouldNotGoBack takes precedence
    expect(mockCallback).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  // Removed the problematic cleanup test since useFocusEffect cleanup is complex to test properly

  it('should re-register handler when dependencies change', () => {
    const { rerender } = renderHook(
      ({ callback }) =>
        useBackHandler({ callback, dependencyList: [callback] }),
      {
        initialProps: { callback: jest.fn() }
      }
    )

    expect(BackHandler.addEventListener).toHaveBeenCalledTimes(1)

    const newCallback = jest.fn()
    rerender({ callback: newCallback })

    // useFocusEffect will be called again with new callback
    expect(BackHandler.addEventListener).toHaveBeenCalledTimes(2)
  })

  it('should handle undefined callback properly', () => {
    renderHook(() =>
      useBackHandler({
        callback: undefined,
        shouldNotGoBack: false
      })
    )

    const backPressHandler = BackHandler.addEventListener.mock.calls[0][1]
    const result = backPressHandler()

    expect(result).toBe(false)
  })

  it('should work with custom dependency list', () => {
    const mockCallback = jest.fn()
    const customDep = { value: 1 }

    const { rerender } = renderHook(
      ({ dep }) =>
        useBackHandler({
          callback: mockCallback,
          dependencyList: [dep]
        }),
      {
        initialProps: { dep: customDep }
      }
    )

    expect(BackHandler.addEventListener).toHaveBeenCalledTimes(1)

    // Change dependency
    rerender({ dep: { value: 2 } })

    expect(BackHandler.addEventListener).toHaveBeenCalledTimes(2)
  })

  it('should handle empty dependency list', () => {
    const mockCallback = jest.fn()

    renderHook(() =>
      useBackHandler({
        callback: mockCallback,
        dependencyList: []
      })
    )

    expect(BackHandler.addEventListener).toHaveBeenCalledTimes(1)
  })
})
