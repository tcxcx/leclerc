import { useRef } from 'react'

import { renderHook, act } from '@testing-library/react'

import { useScrollOverflow } from './useScrollOverflow'

function MockResizeObserver(callback) {
  this.callback = callback
  this.observed = new Set()
  MockResizeObserver.lastInstance = this
}
MockResizeObserver.prototype.observe = function (el) {
  this.observed.add(el)
}
MockResizeObserver.prototype.disconnect = function () {
  this.observed.clear()
}
MockResizeObserver.prototype.fire = function () {
  this.callback([], this)
}
MockResizeObserver.lastInstance = null

function MockMutationObserver(callback) {
  this.callback = callback
  MockMutationObserver.lastInstance = this
}
MockMutationObserver.prototype.observe = function () {}
MockMutationObserver.prototype.disconnect = function () {}
MockMutationObserver.prototype.fire = function () {
  this.callback([], this)
}
MockMutationObserver.lastInstance = null

const setRect = (el, rect) => {
  el.getBoundingClientRect = () => ({
    top: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect
  })
}

const setClientHeight = (el, h) => {
  Object.defineProperty(el, 'clientHeight', {
    configurable: true,
    value: h
  })
}

const buildContainer = ({
  containerHeight,
  lastChildBottom,
  childCount = 1
}) => {
  const container = document.createElement('div')
  setRect(container, {
    top: 0,
    bottom: containerHeight,
    height: containerHeight
  })
  setClientHeight(container, containerHeight)
  container.scrollTop = 0
  for (let i = 0; i < childCount - 1; i++) {
    container.appendChild(document.createElement('div'))
  }
  const last = document.createElement('div')
  setRect(last, { top: lastChildBottom - 20, bottom: lastChildBottom })
  container.appendChild(last)
  return container
}

describe('useScrollOverflow', () => {
  const realResizeObserver = global.ResizeObserver
  const realMutationObserver = global.MutationObserver

  beforeEach(() => {
    global.ResizeObserver = MockResizeObserver
    global.MutationObserver = MockMutationObserver
    MockResizeObserver.lastInstance = null
    MockMutationObserver.lastInstance = null
  })

  afterEach(() => {
    global.ResizeObserver = realResizeObserver
    global.MutationObserver = realMutationObserver
  })

  const renderWith = (container, deps = []) =>
    renderHook(() => {
      const ref = useRef(container)
      return useScrollOverflow(ref, deps)
    })

  it('returns false when the container has no children', () => {
    const container = document.createElement('div')
    setClientHeight(container, 100)
    setRect(container, { bottom: 100, height: 100 })
    const { result } = renderWith(container)
    expect(result.current).toBe(false)
  })

  it('returns false when the last child fits within the container', () => {
    const container = buildContainer({
      containerHeight: 220,
      lastChildBottom: 200
    })
    const { result } = renderWith(container)
    expect(result.current).toBe(false)
  })

  it('returns true when the last child extends past the container height', () => {
    const container = buildContainer({
      containerHeight: 220,
      lastChildBottom: 400
    })
    const { result } = renderWith(container)
    expect(result.current).toBe(true)
  })

  it('ignores absolutely-positioned descendants that inflate scrollHeight', () => {
    // The defining test: emulate what a favorite badge does. scrollHeight is
    // huge, but the last child (an actual list row) sits within the viewport.
    const container = buildContainer({
      containerHeight: 220,
      lastChildBottom: 180
    })
    Object.defineProperty(container, 'scrollHeight', {
      configurable: true,
      value: 9999
    })
    const { result } = renderWith(container)
    expect(result.current).toBe(false)
  })

  it('treats sub-pixel overhang as non-overflow', () => {
    const container = buildContainer({
      containerHeight: 220,
      lastChildBottom: 220.3
    })
    const { result } = renderWith(container)
    expect(result.current).toBe(false)
  })

  it('re-measures when ResizeObserver fires', () => {
    const container = buildContainer({
      containerHeight: 220,
      lastChildBottom: 200
    })
    const { result } = renderWith(container)
    expect(result.current).toBe(false)

    // Simulate a child resize that pushes the last row past the bottom.
    const last = container.lastElementChild
    setRect(last, { top: 280, bottom: 300 })

    act(() => {
      MockResizeObserver.lastInstance.fire()
    })

    expect(result.current).toBe(true)
  })

  it('re-measures when MutationObserver fires (children added)', () => {
    const container = buildContainer({
      containerHeight: 220,
      lastChildBottom: 200
    })
    const { result } = renderWith(container)
    expect(result.current).toBe(false)

    const newLast = document.createElement('div')
    setRect(newLast, { top: 380, bottom: 400 })
    container.appendChild(newLast)

    act(() => {
      MockMutationObserver.lastInstance.fire()
    })

    expect(result.current).toBe(true)
  })

  it('disconnects observers on unmount', () => {
    const container = buildContainer({
      containerHeight: 220,
      lastChildBottom: 200
    })
    const ro = []
    const mo = []
    global.ResizeObserver = function (cb) {
      MockResizeObserver.call(this, cb)
      this.disconnected = false
      ro.push(this)
    }
    global.ResizeObserver.prototype = Object.create(
      MockResizeObserver.prototype
    )
    global.ResizeObserver.prototype.disconnect = function () {
      MockResizeObserver.prototype.disconnect.call(this)
      this.disconnected = true
    }

    global.MutationObserver = function (cb) {
      MockMutationObserver.call(this, cb)
      this.disconnected = false
      mo.push(this)
    }
    global.MutationObserver.prototype = Object.create(
      MockMutationObserver.prototype
    )
    global.MutationObserver.prototype.disconnect = function () {
      this.disconnected = true
    }

    const { unmount } = renderWith(container)
    unmount()

    expect(ro.every((o) => o.disconnected)).toBe(true)
    expect(mo.every((o) => o.disconnected)).toBe(true)
  })
})
