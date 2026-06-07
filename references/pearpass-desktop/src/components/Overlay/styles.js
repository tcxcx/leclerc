import styled from 'styled-components'

import { BASE_TRANSITION_DURATION } from '../../constants/transitions'

const SCRIM_BLUR = 'rgba(0, 0, 0, 0.5)'

export const OverlayComponent = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isShown', 'scrim'].includes(prop)
})`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${({ isShown }) => (isShown ? 1 : 0)};
  transition: opacity ${BASE_TRANSITION_DURATION}ms ease-in-out;
  background: ${({ type, scrim }) => {
    if (type === 'default') {
      return scrim
    }

    if (type === 'blur') {
      return SCRIM_BLUR
    }
  }};
  backdrop-filter: ${({ type }) => {
    if (type === 'default') {
      return 'none'
    }

    if (type === 'blur') {
      return 'blur(10px)'
    }
  }};
`
