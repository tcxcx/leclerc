/* eslint-env jest */

const path = require('path')

const { clearStaleVaultsDir } = require('./clearStaleVaultsDir.cjs')

const STORAGE_PATH = '/storage'
const VAULTS_DIR = path.join(STORAGE_PATH, 'vaults')
const VAULT_DATA_DIR = path.join(STORAGE_PATH, 'vault')

const makeFs = ({ vaultsExists, vaultDataExists, vaultDataChildren }) => ({
  existsSync: jest.fn((p) => {
    if (p === VAULTS_DIR) return vaultsExists
    if (p === VAULT_DATA_DIR) return vaultDataExists
    return false
  }),
  readdirSync: jest.fn((p) => {
    if (p === VAULT_DATA_DIR) return vaultDataChildren || []
    return []
  }),
  rmSync: jest.fn()
})

const makeLogger = () => ({
  warn: jest.fn(),
  info: jest.fn()
})

describe('clearStaleVaultsDir', () => {
  it('deletes the vaults dir when it exists and vault/ is missing', async () => {
    const fsImpl = makeFs({ vaultsExists: true, vaultDataExists: false })
    const logger = makeLogger()

    const result = await clearStaleVaultsDir({
      storagePath: STORAGE_PATH,
      logger,
      fsImpl
    })

    expect(fsImpl.rmSync).toHaveBeenCalledWith(VAULTS_DIR, {
      recursive: true,
      force: true
    })
    expect(result).toEqual({ deleted: true })
  })

  it('deletes the vaults dir when vault/ exists but is empty', async () => {
    const fsImpl = makeFs({
      vaultsExists: true,
      vaultDataExists: true,
      vaultDataChildren: []
    })
    const logger = makeLogger()

    const result = await clearStaleVaultsDir({
      storagePath: STORAGE_PATH,
      logger,
      fsImpl
    })

    expect(fsImpl.rmSync).toHaveBeenCalledWith(VAULTS_DIR, {
      recursive: true,
      force: true
    })
    expect(result).toEqual({ deleted: true })
  })

  it('does nothing when the vaults dir does not exist', async () => {
    const fsImpl = makeFs({ vaultsExists: false, vaultDataExists: false })
    const logger = makeLogger()

    const result = await clearStaleVaultsDir({
      storagePath: STORAGE_PATH,
      logger,
      fsImpl
    })

    expect(fsImpl.rmSync).not.toHaveBeenCalled()
    expect(result).toEqual({ deleted: false, reason: 'no-vaults-dir' })
  })

  it('refuses to delete when vault/ has children', async () => {
    const fsImpl = makeFs({
      vaultsExists: true,
      vaultDataExists: true,
      vaultDataChildren: ['some-vault-id']
    })
    const logger = makeLogger()

    const result = await clearStaleVaultsDir({
      storagePath: STORAGE_PATH,
      logger,
      fsImpl
    })

    expect(fsImpl.rmSync).not.toHaveBeenCalled()
    expect(result).toEqual({ deleted: false, reason: 'has-user-data' })
    expect(logger.warn).toHaveBeenCalledWith(
      'MAIN',
      'clearStaleVaultsDir: refusing to delete vaults — found existing user data',
      { hasVaultData: true }
    )
  })

  it('swallows errors and returns error result', async () => {
    const error = new Error('boom')
    const fsImpl = makeFs({ vaultsExists: true, vaultDataExists: false })
    fsImpl.rmSync.mockImplementation(() => {
      throw error
    })
    const logger = makeLogger()

    const result = await clearStaleVaultsDir({
      storagePath: STORAGE_PATH,
      logger,
      fsImpl
    })

    expect(result.deleted).toBe(false)
    expect(result.reason).toBe('error')
    expect(result.error).toBe(error)
    expect(logger.warn).toHaveBeenCalledWith(
      'MAIN',
      'Failed to clear stale vaults dir:',
      'boom'
    )
  })

  it('swallows errors from existsSync', async () => {
    const error = new Error('stat failed')
    const fsImpl = makeFs({ vaultsExists: true, vaultDataExists: false })
    fsImpl.existsSync.mockImplementation(() => {
      throw error
    })
    const logger = makeLogger()

    const result = await clearStaleVaultsDir({
      storagePath: STORAGE_PATH,
      logger,
      fsImpl
    })

    expect(result.deleted).toBe(false)
    expect(result.reason).toBe('error')
    expect(fsImpl.rmSync).not.toHaveBeenCalled()
  })
})
