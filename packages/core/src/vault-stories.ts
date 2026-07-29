export type VaultDatabase = "dossier" | "finance" | "opsConsole";
export type VaultObjectStore = "records" | "transactions" | "goals" | "workspace";
export type VaultLocalStorageKey = "passphraseSalt" | "deviceKey";
export type VaultStateId = "opsConsole";

export interface VaultStory {
  id: string;
  indexedDb: {
    databases: Record<VaultDatabase, string>;
    stores: Record<VaultObjectStore, string>;
    stateIds: Record<VaultStateId, string>;
  };
  localStorage: Record<VaultLocalStorageKey, string>;
}

export const DEFAULT_VAULT_STORY: VaultStory = {
  id: "browser-vault-persistence",
  indexedDb: {
    databases: {
      dossier: "leclerc-dossier",
      finance: "leclerc-finance",
      opsConsole: "leclerc-ops-console",
    },
    stores: {
      records: "records",
      transactions: "transactions",
      goals: "goals",
      workspace: "workspace",
    },
    stateIds: {
      opsConsole: "ops-console-state",
    },
  },
  localStorage: {
    passphraseSalt: "leclerc-salt",
    deviceKey: "leclerc-device-vault-key-v1",
  },
};

export function vaultDatabaseName(
  database: VaultDatabase,
  story: VaultStory = DEFAULT_VAULT_STORY,
): string {
  return story.indexedDb.databases[database];
}

export function vaultStoreName(
  store: VaultObjectStore,
  story: VaultStory = DEFAULT_VAULT_STORY,
): string {
  return story.indexedDb.stores[store];
}

export function vaultStateId(
  state: VaultStateId,
  story: VaultStory = DEFAULT_VAULT_STORY,
): string {
  return story.indexedDb.stateIds[state];
}

export function vaultLocalStorageKey(
  key: VaultLocalStorageKey,
  story: VaultStory = DEFAULT_VAULT_STORY,
): string {
  return story.localStorage[key];
}
