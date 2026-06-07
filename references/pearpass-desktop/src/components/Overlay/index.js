import { useRef } from 'react'

import { useTheme } from '@tetherto/pearpass-lib-ui-kit'
import { html } from 'htm/react'

import { OverlayComponent } from './styles'
import { BASE_TRANSITION_DURATION } from '../../constants/transitions'
import { useAnimatedVisibility } from '../../hooks/useAnimatedVisibility'

/**
 * @param {{
 *  isOpen: boolean
 *  onClick: () => void
 *  type: 'default' | 'blur'
 * }} props
 */
export const Overlay = ({ isOpen, onClick, type = 'default' }) => {
  const { theme } = useTheme()
  const nodeRef = useRef(null)
  const { isShown, isRendered } = useAnimatedVisibility({
    isOpen: isOpen,
    transitionDuration: BASE_TRANSITION_DURATION,
    nodeRef,
    propertyName: 'opacity'
  })

  if (!isRendered) {
    return null
  }

  return html`
    <${OverlayComponent}
      ref=${nodeRef}
      type=${type}
      isShown=${isShown}
      scrim=${theme.colors.colorScrim}
      onClick=${() => onClick?.()}
    />
  `
}
