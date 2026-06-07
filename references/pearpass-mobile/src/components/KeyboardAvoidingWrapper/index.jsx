import { Platform } from 'react-native'

import { KeyboardAvoid } from './styles'

/**
 *
 * @param {{
 *  children: import ('react').ReactNode;
 * }} props
 */
export const KeyboardAvoidingWrapper = ({ children }) => (
  <KeyboardAvoid behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    {children}
  </KeyboardAvoid>
)
