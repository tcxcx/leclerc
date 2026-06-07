import { useRef } from 'react'

import { renderHook, act } from '@testing-library/react'

import { useAnimatedVisibility } from './useAnimatedVisibility'

jest.useFakeTimers()

const SAFETY_BUFFER = 100

describe('useAnimatedVisibility', () => {
  test('initial state when isOpen is false', () => {
    const { result } = renderHook(() =>
      useAnimatedVisibility({ isOpen: false })
    )

    expect(result.current.isShown).toBe(false)
    expect(result.current.isRendered).toBe(false)
  })

  test('initial state when isOpen is true', () => {
    const { result } = renderHook(() => useAnimatedVisibility({ isOpen: true }))

    expect(result.current.isShown).toBe(true)
    expect(result.current.isRendered).toBe(true)
  })

  test('transitions from closed to open', () => {
    const { result, rerender } = renderHook(
      (props) => useAnimatedVisibility(props),
      { initialProps: { isOpen: false } }
    )

    expect(result.current.isShown).toBe(false)
    expect(result.current.isRendered).toBe(false)

    rerender({ isOpen: true })

    expect(result.current.isShown).toBe(true)
    expect(result.current.isRendered).toBe(true)
  })

  test('transitions from open to closed', () => {
    const { result, rerender } = renderHook(
      (props) => useAnimatedVisibility(props),
      { initialProps: { isOpen: true, transitionDuration: 300 } }
    )

    expect(result.current.isShown).toBe(true)
    expect(result.current.isRendered).toBe(true)

    rerender({ isOpen: false, transitionDuration: 300 })

    expect(result.current.isShown).toBe(false)
    expect(result.current.isRendered).toBe(true)

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current.isShown).toBe(false)
    expect(result.current.isRendered).toBe(false)
  })

  test('uses custom transition duration', () => {
    const customDuration = 500
    const { result, rerender } = renderHook(
      (props) => useAnimatedVisibility(props),
      { initialProps: { isOpen: true, transitionDuration: customDuration } }
    )

    rerender({ isOpen: false, transitionDuration: customDuration })

    expect(result.current.isRendered).toBe(true)

    act(() => {
      jest.advanceTimersByTime(customDuration - 10)
    })

    expect(result.current.isRendered).toBe(true)

    act(() => {
      jest.advanceTimersByTime(10)
    })

    expect(result.current.isRendered).toBe(false)
  })

  describe('with nodeRef + propertyName', () => {
    const renderWithNode = (node, initialProps = {}) =>
      renderHook(
        (props) => {
          const ref = useRef(node)
          return useAnimatedVisibility({
            ...props,
            nodeRef: ref,
            propertyName: 'opacity'
          })
        },
        {
          initialProps: {
            isOpen: true,
            transitionDuration: 300,
            ...initialProps
          }
        }
      )

    test('finalizes on matching transitionend before the fallback timer', () => {
      const node = document.createElement('div')
      const { result, rerender } = renderWithNode(node)

      rerender({ isOpen: false, transitionDuration: 300 })
      expect(result.current.isRendered).toBe(true)

      act(() => {
        const event = new Event('transitionend')
        Object.defineProperty(event, 'propertyName', { value: 'opacity' })
        Object.defineProperty(event, 'target', { value: node })
        node.dispatchEvent(event)
      })

      expect(result.current.isRendered).toBe(false)
    })

    test('ignores transitionend for a different property', () => {
      const node = document.createElement('div')
      const { result, rerender } = renderWithNode(node)

      rerender({ isOpen: false, transitionDuration: 300 })

      act(() => {
        const event = new Event('transitionend')
        Object.defineProperty(event, 'propertyName', { value: 'transform' })
        Object.defineProperty(event, 'target', { value: node })
        node.dispatchEvent(event)
      })

      // Still rendered: the transform transitionend doesn't match opacity.
      expect(result.current.isRendered).toBe(true)
    })

    test('ignores transitionend bubbling up from a descendant', () => {
      const node = document.createElement('div')
      const child = document.createElement('span')
      node.appendChild(child)

      const { result, rerender } = renderWithNode(node)
      rerender({ isOpen: false, transitionDuration: 300 })

      act(() => {
        const event = new Event('transitionend', { bubbles: true })
        Object.defineProperty(event, 'propertyName', { value: 'opacity' })
        Object.defineProperty(event, 'target', { value: child })
        child.dispatchEvent(event)
      })

      expect(result.current.isRendered).toBe(true)
    })

    test('falls back after transitionDuration + SAFETY_BUFFER if no event fires', () => {
      const node = document.createElement('div')
      const { result, rerender } = renderWithNode(node)

      rerender({ isOpen: false, transitionDuration: 300 })

      act(() => {
        jest.advanceTimersByTime(300 + SAFETY_BUFFER - 1)
      })
      expect(result.current.isRendered).toBe(true)

      act(() => {
        jest.advanceTimersByTime(1)
      })
      expect(result.current.isRendered).toBe(false)
    })

    test('does not double-fire when transitionend and fallback both occur', () => {
      const node = document.createElement('div')
      const { result, rerender } = renderWithNode(node)

      rerender({ isOpen: false, transitionDuration: 300 })

      act(() => {
        const event = new Event('transitionend')
        Object.defineProperty(event, 'propertyName', { value: 'opacity' })
        Object.defineProperty(event, 'target', { value: node })
        node.dispatchEvent(event)
      })
      expect(result.current.isRendered).toBe(false)

      // Fallback timer firing after the listener already finalized must be a
      // no-op — not flip state back to a stale value.
      act(() => {
        jest.advanceTimersByTime(SAFETY_BUFFER + 300)
      })
      expect(result.current.isRendered).toBe(false)
    })

    test('removes the transitionend listener on unmount', () => {
      const node = document.createElement('div')
      const removeSpy = jest.spyOn(node, 'removeEventListener')

      const { rerender, unmount } = renderWithNode(node)
      rerender({ isOpen: false, transitionDuration: 300 })

      unmount()

      expect(removeSpy).toHaveBeenCalledWith(
        'transitionend',
        expect.any(Function)
      )
    })
  })
})
