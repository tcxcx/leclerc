import { useEffect, useState } from 'react'

import { BASE_TRANSITION_DURATION } from '../constants/transitions'

const SAFETY_BUFFER = 100

/**
 * @param {{
 *  isOpen: boolean
 *  transitionDuration?: number
 *  nodeRef?: import('react').RefObject<HTMLElement>
 *  propertyName?: string
 * }} params
 * @returns {{
 *  isShown: boolean
 *  isRendered: boolean
 * }}
 */
export const useAnimatedVisibility = ({
  isOpen,
  transitionDuration = BASE_TRANSITION_DURATION,
  nodeRef,
  propertyName
}) => {
  const [isShown, setIsShown] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsShown(true)
      return
    }

    const node = nodeRef?.current ?? null
    const useTransitionEnd = !!(node && propertyName)
    let done = false

    const finish = () => {
      if (done) return
      done = true
      setIsShown(false)
    }

    const handleTransitionEnd = (event) => {
      if (event.target !== node) return
      if (event.propertyName !== propertyName) return
      finish()
    }

    if (useTransitionEnd) {
      node.addEventListener('transitionend', handleTransitionEnd)
    }

    const fallbackDelay = useTransitionEnd
      ? transitionDuration + SAFETY_BUFFER
      : transitionDuration
    const fallbackTimer = setTimeout(finish, fallbackDelay)

    return () => {
      if (useTransitionEnd) {
        node.removeEventListener('transitionend', handleTransitionEnd)
      }
      clearTimeout(fallbackTimer)
    }
  }, [isOpen, transitionDuration, nodeRef, propertyName])

  return { isShown: isShown && isOpen, isRendered: isShown || isOpen }
}
