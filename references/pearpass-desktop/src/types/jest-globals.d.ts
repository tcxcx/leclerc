declare const jest: typeof import('@jest/globals').jest

declare function describe(
  name: string,
  fn: () => void
): void

declare function it(
  name: string,
  fn: () => void | Promise<void>
): void

declare function test(
  name: string,
  fn: () => void | Promise<void>
): void

declare function beforeEach(fn: () => void | Promise<void>): void
declare function afterEach(fn: () => void | Promise<void>): void

interface AsyncMatchers {
  toThrow(expected?: string | RegExp | Error): Promise<void>
  not: AsyncMatchers
}

interface Matchers<R = void> {
  toBe(expected: unknown): R
  toEqual(expected: unknown): R
  toBeTruthy(): R
  toBeFalsy(): R
  toBeNull(): R
  toBeUndefined(): R
  toBeDefined(): R
  toContain(expected: unknown): R
  toHaveLength(expected: number): R
  toHaveProperty(key: string, value?: unknown): R
  toMatchObject(expected: unknown): R
  toBeInTheDocument(): R
  toHaveBeenCalledTimes(expected: number): R
  toHaveBeenCalledWith(...args: unknown[]): R
  toHaveBeenNthCalledWith(n: number, ...args: unknown[]): R
  toHaveBeenLastCalledWith(...args: unknown[]): R
  toHaveBeenCalled(): R
  toHaveAttribute(attr: string, value?: unknown): R
  toBeDisabled(): R
  toBeChecked(): R
  toHaveValue(expected?: string | number | string[]): R
  toThrow(expected?: string | RegExp | Error): R
  not: Matchers<R>
  rejects: AsyncMatchers
}

declare function expect<T = unknown>(actual: T): Matchers<void>

declare namespace expect {
  function arrayContaining<T = unknown>(items: T[]): T[]
  function objectContaining<T = Record<string, unknown>>(object: T): T
  function stringContaining(value: string): string
  function stringMatching(value: string | RegExp): string
  function any(constructor: unknown): unknown
  function anything(): unknown
}
