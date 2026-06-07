import { render, act } from '@testing-library/react-native'
import { Text } from 'react-native'

import { useAutoLockContext } from '../../context/AutoLockContext'
import { withAutoLockBypass } from '../withAutoLockBypass'

jest.mock('../../context/AutoLockContext', () => ({
  useAutoLockContext: jest.fn()
}))

describe('withAutoLockBypass', () => {
  const mockSetShouldBypassAutoLock = jest.fn()

  beforeEach(() => {
    useAutoLockContext.mockReturnValue({
      setShouldBypassAutoLock: mockSetShouldBypassAutoLock
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should wrap component and set correct display name', () => {
    const TestComponent = () => <Text>Test</Text>
    TestComponent.displayName = 'TestComponent'

    const WrappedComponent = withAutoLockBypass(TestComponent)
    expect(WrappedComponent.displayName).toBe(
      'WithAutoLockBypass(TestComponent)'
    )
  })

  it('should enable auto lock bypass on mount', () => {
    const TestComponent = () => <Text>Test</Text>
    const WrappedComponent = withAutoLockBypass(TestComponent)

    render(<WrappedComponent />)

    expect(mockSetShouldBypassAutoLock).toHaveBeenCalledWith(true)
  })

  it('should disable auto lock bypass on unmount', () => {
    const TestComponent = () => <Text>Test</Text>
    const WrappedComponent = withAutoLockBypass(TestComponent)

    const { unmount } = render(<WrappedComponent />)

    act(() => {
      unmount()
    })

    expect(mockSetShouldBypassAutoLock).toHaveBeenCalledWith(false)
  })

  it('should pass through props to wrapped component', () => {
    const TestComponent = ({ testProp }) => <Text>{testProp}</Text>
    const WrappedComponent = withAutoLockBypass(TestComponent)

    const { getByText } = render(<WrappedComponent testProp="test value" />)

    expect(getByText('test value')).toBeTruthy()
  })

  it('should handle components without display name', () => {
    const TestComponent = () => <Text>Test</Text>
    const WrappedComponent = withAutoLockBypass(TestComponent)
    expect(WrappedComponent.displayName).toBe(
      'WithAutoLockBypass(TestComponent)'
    )
  })

  it('should handle anonymous components', () => {
    const WrappedComponent = withAutoLockBypass(() => <Text>Test</Text>)
    expect(WrappedComponent.displayName).toBe('WithAutoLockBypass(Component)')
  })
})
