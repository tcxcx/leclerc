import { useEffect } from 'react'

import { useAutoLockContext } from '../context/AutoLockContext'

export const withAutoLockBypass = (WrappedComponent) => {
  const WithAutoLockBypass = (props) => {
    const { setShouldBypassAutoLock } = useAutoLockContext()

    useEffect(() => {
      setShouldBypassAutoLock(true)
      return () => setShouldBypassAutoLock(false)
    }, [])

    return <WrappedComponent {...props} />
  }
  WithAutoLockBypass.displayName = `WithAutoLockBypass(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return WithAutoLockBypass
}
