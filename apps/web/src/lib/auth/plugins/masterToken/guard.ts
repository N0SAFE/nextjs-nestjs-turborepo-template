import { authClient } from '../..'
import type { MasterTokenManager as _MasterTokenManager } from './state'

// The runtime plugin exposes these actions on the auth client.
export type MasterTokenActions = {
  masterTokenSignOut: typeof authClient.signOut
  getMasterTokenEnabled: typeof import('./state').getMasterTokenEnabled
  setMasterTokenEnabled: typeof import('./state').setMasterTokenEnabled
  clearMasterToken: typeof import('./state').clearMasterToken
  getMasterTokenKey: typeof import('./state').getMasterTokenKey
  MasterTokenManager: typeof _MasterTokenManager
}

/**
 * Runtime type-guard that narrows an `AuthClient` to include the master-token
 * plugin actions when they are present on the object.
 */
export function hasMasterTokenPlugin(
  client: typeof authClient | unknown
): client is typeof authClient & MasterTokenActions {
  const candidate = client as Record<string, unknown>
  // check for a small set of keys that the plugin adds
  return (
    'masterTokenSignOut' in candidate || typeof candidate.masterTokenSignOut !== 'undefined' ||
    'getMasterTokenEnabled' in candidate || typeof candidate.getMasterTokenEnabled !== 'undefined' ||
    'setMasterTokenEnabled' in candidate || typeof candidate.setMasterTokenEnabled !== 'undefined' ||
    'clearMasterToken' in candidate || typeof candidate.clearMasterToken !== 'undefined' ||
    'getMasterTokenKey' in candidate || typeof candidate.getMasterTokenKey !== 'undefined' ||
    'MasterTokenManager' in candidate || typeof candidate.MasterTokenManager !== 'undefined'
  )
}

export default hasMasterTokenPlugin
