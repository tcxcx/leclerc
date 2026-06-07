import { render } from '@testing-library/react-native'
import { Platform, Text, View } from 'react-native'

import { KeyboardAvoidingWrapper } from './index'

jest.mock('./styles', () => ({
  KeyboardAvoid: (props) => (
    <div {...props} testID="keyboard-avoid">
      {props.children}
    </div>
  )
}))

jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const Platform = jest.requireActual(
    'react-native/Libraries/Utilities/Platform'
  )
  Platform.OS = 'ios'
  return Platform
})

describe('KeyboardAvoidingWrapper component', () => {
  test('renders correctly with children', () => {
    const testId = 'test-child'
    const { getByTestId, toJSON } = render(
      <KeyboardAvoidingWrapper>
        <View testID={testId} />
      </KeyboardAvoidingWrapper>
    )

    expect(getByTestId('keyboard-avoid')).toBeTruthy()
    expect(getByTestId(testId)).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  test('uses "padding" behavior on iOS', () => {
    Platform.OS = 'ios'
    const { getByTestId } = render(
      <KeyboardAvoidingWrapper>
        <View />
      </KeyboardAvoidingWrapper>
    )

    expect(getByTestId('keyboard-avoid').props.behavior).toBe('padding')
  })

  test('uses "height" behavior on Android', () => {
    Platform.OS = 'android'
    const { getByTestId } = render(
      <KeyboardAvoidingWrapper>
        <View />
      </KeyboardAvoidingWrapper>
    )

    expect(getByTestId('keyboard-avoid').props.behavior).toBe('height')
  })

  test('passes children correctly', () => {
    const childText = 'Test Child'
    const { getByText } = render(
      <KeyboardAvoidingWrapper>
        <View>
          <Text>{childText}</Text>
        </View>
      </KeyboardAvoidingWrapper>
    )

    expect(getByText(childText)).toBeTruthy()
  })
})
