import { renderHook, act } from '@testing-library/react-native'
import { Keyboard, Platform } from 'react-native'

import { useKeyboardVisibility } from './useKeyboardVisibility'

// Mock React Native modules
jest.mock('react-native', () => ({
  Keyboard: {
    addListener: jest.fn()
  },
  Platform: {
    OS: 'ios'
  }
}))

describe('useKeyboardVisibility', () => {
  let mockShowSubscription
  let mockHideSubscription
  let keyboardShowCallback
  let keyboardHideCallback

  beforeEach(() => {
    jest.clearAllMocks()

    mockShowSubscription = { remove: jest.fn() }
    mockHideSubscription = { remove: jest.fn() }

    Keyboard.addListener.mockImplementation((event, callback) => {
      if (event.includes('Show')) {
        keyboardShowCallback = callback
        return mockShowSubscription
      } else if (event.includes('Hide')) {
        keyboardHideCallback = callback
        return mockHideSubscription
      }
    })
  })

  describe('iOS platform', () => {
    beforeEach(() => {
      Platform.OS = 'ios'
    })

    it('should initialize with keyboard not visible', () => {
      const { result } = renderHook(() => useKeyboardVisibility())

      expect(result.current.isKeyboardVisible).toBe(false)
      expect(result.current.keyboardHeight).toBe(0)
    })

    it('should register iOS keyboard event listeners', () => {
      renderHook(() => useKeyboardVisibility())

      expect(Keyboard.addListener).toHaveBeenCalledWith(
        'keyboardWillShow',
        expect.any(Function)
      )
      expect(Keyboard.addListener).toHaveBeenCalledWith(
        'keyboardWillHide',
        expect.any(Function)
      )
    })

    it('should update state when keyboard shows', () => {
      const { result } = renderHook(() => useKeyboardVisibility())

      const mockKeyboardEvent = {
        endCoordinates: {
          height: 300
        }
      }

      act(() => {
        keyboardShowCallback(mockKeyboardEvent)
      })

      expect(result.current.isKeyboardVisible).toBe(true)
      expect(result.current.keyboardHeight).toBe(300)
    })

    it('should handle keyboard show event without height', () => {
      const { result } = renderHook(() => useKeyboardVisibility())

      const mockKeyboardEvent = {}

      act(() => {
        keyboardShowCallback(mockKeyboardEvent)
      })

      expect(result.current.isKeyboardVisible).toBe(true)
      expect(result.current.keyboardHeight).toBe(0)
    })

    it('should update state when keyboard hides', () => {
      const { result } = renderHook(() => useKeyboardVisibility())

      // First show keyboard
      act(() => {
        keyboardShowCallback({ endCoordinates: { height: 300 } })
      })

      expect(result.current.isKeyboardVisible).toBe(true)
      expect(result.current.keyboardHeight).toBe(300)

      // Then hide keyboard
      act(() => {
        keyboardHideCallback()
      })

      expect(result.current.isKeyboardVisible).toBe(false)
      expect(result.current.keyboardHeight).toBe(0)
    })

    it('should clean up subscriptions on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardVisibility())

      unmount()

      expect(mockShowSubscription.remove).toHaveBeenCalled()
      expect(mockHideSubscription.remove).toHaveBeenCalled()
    })
  })

  describe('Android platform', () => {
    beforeEach(() => {
      Platform.OS = 'android'
    })

    it('should register Android keyboard event listeners', () => {
      renderHook(() => useKeyboardVisibility())

      expect(Keyboard.addListener).toHaveBeenCalledWith(
        'keyboardDidShow',
        expect.any(Function)
      )
      expect(Keyboard.addListener).toHaveBeenCalledWith(
        'keyboardDidHide',
        expect.any(Function)
      )
    })

    it('should handle Android keyboard events correctly', () => {
      const { result } = renderHook(() => useKeyboardVisibility())

      const mockKeyboardEvent = {
        endCoordinates: {
          height: 250
        }
      }

      act(() => {
        keyboardShowCallback(mockKeyboardEvent)
      })

      expect(result.current.isKeyboardVisible).toBe(true)
      expect(result.current.keyboardHeight).toBe(250)

      act(() => {
        keyboardHideCallback()
      })

      expect(result.current.isKeyboardVisible).toBe(false)
      expect(result.current.keyboardHeight).toBe(0)
    })
  })

  it('should handle multiple keyboard show/hide cycles', () => {
    const { result } = renderHook(() => useKeyboardVisibility())

    // First cycle
    act(() => {
      keyboardShowCallback({ endCoordinates: { height: 300 } })
    })
    expect(result.current.isKeyboardVisible).toBe(true)
    expect(result.current.keyboardHeight).toBe(300)

    act(() => {
      keyboardHideCallback()
    })
    expect(result.current.isKeyboardVisible).toBe(false)
    expect(result.current.keyboardHeight).toBe(0)

    // Second cycle with different height
    act(() => {
      keyboardShowCallback({ endCoordinates: { height: 350 } })
    })
    expect(result.current.isKeyboardVisible).toBe(true)
    expect(result.current.keyboardHeight).toBe(350)

    act(() => {
      keyboardHideCallback()
    })
    expect(result.current.isKeyboardVisible).toBe(false)
    expect(result.current.keyboardHeight).toBe(0)
  })

  it('should handle null endCoordinates', () => {
    const { result } = renderHook(() => useKeyboardVisibility())

    const mockKeyboardEvent = {
      endCoordinates: null
    }

    act(() => {
      keyboardShowCallback(mockKeyboardEvent)
    })

    expect(result.current.isKeyboardVisible).toBe(true)
    expect(result.current.keyboardHeight).toBe(0)
  })

  it('should only register listeners once on mount', () => {
    const { rerender } = renderHook(() => useKeyboardVisibility())

    expect(Keyboard.addListener).toHaveBeenCalledTimes(2) // show + hide

    rerender()

    expect(Keyboard.addListener).toHaveBeenCalledTimes(2) // Should not increase
  })
})
