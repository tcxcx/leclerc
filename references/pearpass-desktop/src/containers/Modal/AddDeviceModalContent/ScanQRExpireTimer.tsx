import { useCountDown } from '@tetherto/pear-apps-lib-ui-react-hooks'

import { ExpireTime } from './styles'

interface Props {
  initialSeconds?: number
  onFinish?: () => void
  withSuffix?: boolean
}

export const ScanQRExpireTimer = ({
  initialSeconds = 120,
  onFinish,
  withSuffix = false
}: Props) => {
  const expireTime = useCountDown({
    initialSeconds,
    onFinish
  })

  return (
    <ExpireTime>
      {' '}
      {expireTime}
      {withSuffix ? 's' : ''}{' '}
    </ExpireTime>
  )
}
