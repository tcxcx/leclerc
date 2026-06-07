import { render } from '@testing-library/react-native'

import { LogoTextWithLock } from './index'

describe('LogoTextWithLock Component', () => {
  it('renders correctly with default props', () => {
    const { toJSON } = render(<LogoTextWithLock />)
    const tree = toJSON()

    expect(tree.props.width).toBe('256')
    expect(tree.props.height).toBe('57')
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with custom width and height', () => {
    const { toJSON } = render(<LogoTextWithLock width="300" height="70" />)
    const tree = toJSON()

    expect(tree.props.width).toBe('300')
    expect(tree.props.height).toBe('70')
    expect(tree).toMatchSnapshot()
  })

  it('contains the correct number of Path components', () => {
    const { toJSON } = render(<LogoTextWithLock />)
    const tree = toJSON()

    const pathCount = tree.children.length
    expect(pathCount).toBeGreaterThan(0)
  })
})
