import React from 'react'

import { render, act } from '@testing-library/react'

import {
  LoadingProvider,
  useLoadingContext,
  useGlobalLoading
} from './LoadingContext'
import '@testing-library/jest-dom'

jest.mock('../components/LoadingOverlay', () => ({
  LoadingOverlay: () => 'LoadingOverlay'
}))

describe('LoadingContext', () => {
  describe('LoadingProvider', () => {
    it('should render children', () => {
      const { getByText } = render(
        <LoadingProvider>
          <div>Test Child</div>
        </LoadingProvider>
      )

      expect(getByText('Test Child')).toBeInTheDocument()
    })

    it('should show LoadingOverlay when loading', () => {
      const { container } = render(
        <LoadingProvider>
          <div>Test Child</div>
        </LoadingProvider>
      )

      expect(container.innerHTML).not.toContain('LoadingOverlay')

      const TestComponent = () => {
        const { setIsLoading } = useLoadingContext()
        return <button onClick={() => setIsLoading(true)}>Load</button>
      }

      const { getByText } = render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      )

      act(() => {
        getByText('Load').click()
      })

      expect(container.innerHTML).toContain('Test Child')
    })
  })

  describe('useLoadingContext', () => {
    it('should provide loading state and setter', () => {
      let contextValue

      const TestComponent = () => {
        contextValue = useLoadingContext()
        return null
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      )

      expect(contextValue.isLoading).toBe(false)
      expect(typeof contextValue.setIsLoading).toBe('function')

      act(() => {
        contextValue.setIsLoading(true)
      })

      expect(contextValue.isLoading).toBe(true)
    })

    it('should stay loading until every acquire is released', () => {
      let contextValue

      const TestComponent = () => {
        contextValue = useLoadingContext()
        return null
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      )

      act(() => {
        contextValue.setIsLoading(true)
        contextValue.setIsLoading(true)
      })
      expect(contextValue.isLoading).toBe(true)

      act(() => {
        contextValue.setIsLoading(false)
      })
      expect(contextValue.isLoading).toBe(true)

      act(() => {
        contextValue.setIsLoading(false)
      })
      expect(contextValue.isLoading).toBe(false)
    })

    it('should clamp release at zero so stray falses do not underflow', () => {
      let contextValue

      const TestComponent = () => {
        contextValue = useLoadingContext()
        return null
      }

      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      )

      act(() => {
        contextValue.setIsLoading(false)
        contextValue.setIsLoading(false)
        contextValue.setIsLoading(true)
      })

      expect(contextValue.isLoading).toBe(true)
    })
  })

  describe('useGlobalLoading', () => {
    it('should set loading state based on props', () => {
      let contextValue

      const TestComponent = ({ isLoading }) => {
        useGlobalLoading({ isLoading })
        contextValue = useLoadingContext()
        return null
      }

      const { rerender } = render(
        <LoadingProvider>
          <TestComponent isLoading={false} />
        </LoadingProvider>
      )

      expect(contextValue.isLoading).toBe(false)

      rerender(
        <LoadingProvider>
          <TestComponent isLoading={true} />
        </LoadingProvider>
      )

      expect(contextValue.isLoading).toBe(true)
    })

    it('should not set loading state when isLoading is not boolean', () => {
      let contextValue

      const TestComponent = ({ isLoading }) => {
        useGlobalLoading({ isLoading })
        contextValue = useLoadingContext()
        return null
      }

      render(
        <LoadingProvider>
          <TestComponent isLoading={undefined} />
        </LoadingProvider>
      )

      expect(contextValue.isLoading).toBe(false)
    })

    it('should not release a concurrent imperative acquire when its own isLoading flips to false', () => {
      let contextValue

      const TestComponent = ({ isLoading }) => {
        useGlobalLoading({ isLoading })
        contextValue = useLoadingContext()
        return null
      }

      const { rerender } = render(
        <LoadingProvider>
          <TestComponent isLoading={false} />
        </LoadingProvider>
      )

      act(() => {
        contextValue.setIsLoading(true)
      })
      expect(contextValue.isLoading).toBe(true)

      rerender(
        <LoadingProvider>
          <TestComponent isLoading={true} />
        </LoadingProvider>
      )
      rerender(
        <LoadingProvider>
          <TestComponent isLoading={false} />
        </LoadingProvider>
      )

      expect(contextValue.isLoading).toBe(true)
    })
  })
})
