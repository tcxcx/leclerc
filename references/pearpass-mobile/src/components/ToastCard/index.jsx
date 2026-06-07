import { Container, ToastText } from './styles'

/**
 *
 * @param {{
 *  text1: string,
 *  renderLeadingIcon: () => import ('react').ReactNode;
 * }} props
 */
export const ToastCard = ({ text1, renderLeadingIcon }) => (
  <Container>
    {renderLeadingIcon?.()}
    <ToastText>{text1}</ToastText>
  </Container>
)
