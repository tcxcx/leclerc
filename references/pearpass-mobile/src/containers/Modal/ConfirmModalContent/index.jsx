import { useLingui } from '@lingui/react/macro'

import { Actions, Container, Description, Title } from './styles'
import { ButtonPrimary, ButtonSecondary } from '../../../libComponents'

/**
 * @param {{
 *    title: string
 *    text: string
 *    primaryAction: () => void
 *    secondaryAction: () => void
 *    primaryLabel: string
 *    secondaryLabel: string
 * }} props
 */
export const ConfirmModalContent = (props) => {
  const { t } = useLingui()

  const {
    title = t`Are you sure?`,
    text = t`Are you sure you want to proceed?`,
    primaryAction,
    secondaryAction,
    primaryLabel = t`Confirm`,
    secondaryLabel = t`Cancel`
  } = props

  return (
    <Container>
      <Title>{title}</Title>
      <Description>{text}</Description>
      <Actions>
        <ButtonPrimary onPress={primaryAction}>{primaryLabel}</ButtonPrimary>
        <ButtonSecondary onPress={secondaryAction}>
          {secondaryLabel}
        </ButtonSecondary>
      </Actions>
    </Container>
  )
}
