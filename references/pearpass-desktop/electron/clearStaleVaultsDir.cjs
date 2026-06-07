const fs = require('fs')
const path = require('path')

// Recovers from a partial master-password creation: if the app was killed
// mid-flow on a previous attempt, the `vaults` dir on disk is blind-encrypted
// with the abandoned password and the next attempt will fail to open it with
// a new salt. Safe to call only before vaults are opened by the worklet
// (i.e. before createMasterPassword / login). Refuses to delete when the
// sibling `vault/` (singular) dir has children — that dir is written only by
// `initActiveVaultInstance` after a successful `createVault`, so its presence
// with children is unambiguous evidence the user already has at least one
// real vault we must not clobber.
async function clearStaleVaultsDir({ storagePath, logger, fsImpl = fs }) {
  try {
    const vaultsDir = path.join(storagePath, 'vaults')
    const vaultDataDir = path.join(storagePath, 'vault')

    if (!fsImpl.existsSync(vaultsDir)) {
      return { deleted: false, reason: 'no-vaults-dir' }
    }

    const hasVaultData =
      fsImpl.existsSync(vaultDataDir) &&
      fsImpl.readdirSync(vaultDataDir).length > 0

    if (hasVaultData) {
      logger?.warn(
        'MAIN',
        'clearStaleVaultsDir: refusing to delete vaults — found existing user data',
        { hasVaultData }
      )
      return { deleted: false, reason: 'has-user-data' }
    }

    fsImpl.rmSync(vaultsDir, { recursive: true, force: true })
    logger?.info?.('[MAIN]', 'Cleared stale vaults dir at', vaultsDir)
    return { deleted: true }
  } catch (err) {
    logger?.warn(
      'MAIN',
      'Failed to clear stale vaults dir:',
      err && err.message ? err.message : err
    )
    return { deleted: false, reason: 'error', error: err }
  }
}

module.exports = { clearStaleVaultsDir }
