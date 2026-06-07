import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import { html } from 'htm/react'

import { LoadingOverlay } from '../components/LoadingOverlay'

const LoadingContext = createContext()

/**
 * @param {{
 *  children: import('react').ReactNode
 * }} props
 */
export const LoadingProvider = ({ children }) => {
  // Ref-counted so concurrent callers don't stomp each other's loading state.
  const [count, setCount] = useState(0)

  const setIsLoading = useCallback((isLoading) => {
    setCount((prev) => {
      if (isLoading) return prev + 1
      return prev > 0 ? prev - 1 : 0
    })
  }, [])

  const isLoading = count > 0

  return html`
    <${LoadingContext.Provider} value=${{ isLoading, setIsLoading }}>
      ${children} ${isLoading && html`<${LoadingOverlay} />`}
    <//>
  `
}

/**
 * @returns {{
 *  isLoading: boolean,
 *  setIsLoading: (isLoading: boolean) => void
 * }}
 */
export const useLoadingContext = () => useContext(LoadingContext)

/**
 * @param {{
 *  isLoading: boolean
 * }} props
 */
export const useGlobalLoading = ({ isLoading }) => {
  const { setIsLoading } = useLoadingContext()

  useEffect(() => {
    if (isLoading !== true) return
    setIsLoading(true)
    return () => setIsLoading(false)
  }, [isLoading, setIsLoading])
}
