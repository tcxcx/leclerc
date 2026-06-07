import React, { useEffect, useRef, useState } from 'react'

const START_SRC = 'assets/video/onboarding_lock_start.webm'
const LOOP_SRC = 'assets/video/onboarding_lock_loop.webm'

export const OnboardingLockVideo = (): React.ReactElement => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [phase, setPhase] = useState<'start' | 'loop'>('start')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      if (phase === 'start') setPhase('loop')
    }

    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [phase])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.load()
    void video.play().catch(() => {})
  }, [phase])

  return (
    <video
      ref={videoRef}
      src={phase === 'start' ? START_SRC : LOOP_SRC}
      autoPlay
      muted
      playsInline
      loop={phase === 'loop'}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )
}
