import { render } from '@testing-library/react-native'

import { ToastCard } from './index'

jest.mock('./styles', () => {
  const { View, Text } = require('react-native')
  return {
    Container: (props) => <View testID="toast-container" {...props} />,
    ToastText: (props) => (
      <Text testID="toast-text" {...props}>
        {props.children}
      </Text>
    )
  }
})

describe('ToastCard', () => {
  it('renders correctly with text only', () => {
    const { getByTestId, toJSON } = render(
      <ToastCard text1="Test Toast Message" />
    )

    expect(getByTestId('toast-text').props.children).toBe('Test Toast Message')
    expect(getByTestId('toast-container')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly with text and leading icon', () => {
    const { View } = require('react-native')

    const mockIcon = jest.fn().mockReturnValue(<View testID="mock-icon" />)
    const { getByTestId, toJSON } = render(
      <ToastCard text1="Test Toast Message" renderLeadingIcon={mockIcon} />
    )

    expect(getByTestId('toast-text').props.children).toBe('Test Toast Message')
    expect(getByTestId('mock-icon')).toBeTruthy()
    expect(mockIcon).toHaveBeenCalledTimes(1)
    expect(toJSON()).toMatchSnapshot()
  })

  it('handles undefined renderLeadingIcon gracefully', () => {
    const { getByTestId, queryByTestId, toJSON } = render(
      <ToastCard text1="Test Toast Message" renderLeadingIcon={undefined} />
    )

    expect(getByTestId('toast-text').props.children).toBe('Test Toast Message')
    expect(queryByTestId('mock-icon')).toBeNull()
    expect(toJSON()).toMatchSnapshot()
  })

  it('handles empty text gracefully', () => {
    const { getByTestId, toJSON } = render(<ToastCard text1="" />)

    expect(getByTestId('toast-text').props.children).toBe('')
    expect(toJSON()).toMatchSnapshot()
  })
})
