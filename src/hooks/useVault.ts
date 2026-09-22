/**
 * Central vault session hook.
 *
 * SECURITY:
 *  - Holds the CryptoKey and decrypted payload in React state only.
 *  - Never persists the key or plaintext.
 *  - Clears both on lock() and auto-lock.
 *  - Re-reads the encrypted record from IndexedDB on every save.
 *
 * There is no backend. All persistence is to IndexedDB.
 */

import { useCallback, useRef, useState } from 'react';
import type {
  ApiKeyEntry,
  BackupCodeSet,
  VaultEntry,
  VaultPayload,
  VaultRecord,
} from '../types/vault';
import {
  createVault as createVaultCrypto,
  encryptPayload,
  unlockVault,
  type KDFParams,
} from '../crypto';
import {
  buildRecord,
  deleteVaultRecord,
  hasVault as hasVaultInDb,
  loadVaultRecord,
  saveVaultRecord,
} from '../storage/vaultStore';

export type VaultStatus = 'loading' | 'uninitialized' | 'locked' | 'unlocked';

export interface UseVaultResult {
  status: VaultStatus;
  entries: VaultEntry[];
  backupCodeSets: BackupCodeSet[];
  apiKeys: ApiKeyEntry[];
  record: VaultRecord | null;
  createVault: (masterPassword: string) => Promise<void>;
  unlock: (masterPassword: string) => Promise<void>;
  lock: () => void;

  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, patch: Partial<VaultEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;

  addBackupCodeSet: (
    set: Omit<BackupCodeSet, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateBackupCodeSet: (id: string, patch: Partial<BackupCodeSet>) => Promise<void>;
  deleteBackupCodeSet: (id: string) => Promise<void>;

  addApiKey: (key: Omit<ApiKeyEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateApiKey: (id: string, patch: Partial<ApiKeyEntry>) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;

  replaceVault: (record: VaultRecord, key: CryptoKey, payload: VaultPayload) => Promise<void>;
  clearVault: () => Promise<void>;
  refreshFromStorage: () => Promise<void>;
}

function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function emptyPayload(): VaultPayload {
  return { version: 2, entries: [], backupCodeSets: [], apiKeys: [] };
}

export function useVault(): UseVaultResult {
  const [status, setStatus] = useState<VaultStatus>('loading');
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [backupCodeSets, setBackupCodeSets] = useState<BackupCodeSet[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [record, setRecord] = useState<VaultRecord | null>(null);

  const keyRef = useRef<CryptoKey | null>(null);
  const payloadRef = useRef<VaultPayload | null>(null);
  const recordRef = useRef<VaultRecord | null>(null);

  const refreshFromStorage = useCallback(async () => {
    const exists = await hasVaultInDb();
    if (!exists) {
      keyRef.current = null;
      payloadRef.current = null;
      recordRef.current = null;
      setRecord(null);
      setEntries([]);
      setBackupCodeSets([]);
      setApiKeys([]);
      setStatus('uninitialized');
      return;
    }
    const rec = await loadVaultRecord();
    recordRef.current = rec;
    setRecord(rec);
    keyRef.current = null;
    payloadRef.current = null;
    setEntries([]);
    setBackupCodeSets([]);
    setApiKeys([]);
    setStatus('locked');
  }, []);

  const persist = useCallback(async () => {
    const key = keyRef.current;
    const payload = payloadRef.current;
    const existing = recordRef.current;
    if (!key || !payload || !existing) {
      throw new Error('Vault not unlocked');
    }
    const encrypted = await encryptPayload(key, payload);
    const updated = buildRecord({
      salt: existing.salt,
      kdf: existing.kdf,
      encrypted,
      existing,
    });
    await saveVaultRecord(updated);
    recordRef.current = updated;
    setRecord(updated);
  }, []);

  /** Shared mutation cycle: new payload -> setState -> persist. */
  const mutatePayload = useCallback(
    async (fn: (p: VaultPayload) => VaultPayload) => {
      const current = payloadRef.current;
      if (!current) throw new Error('Vault locked');
      const next = fn(current);
      payloadRef.current = next;
      setEntries(next.entries);
      setBackupCodeSets(next.backupCodeSets);
      setApiKeys(next.apiKeys);
      await persist();
    },
    [persist]
  );

  const createVaultFn = useCallback(async (masterPassword: string) => {
    const result = await createVaultCrypto(masterPassword);
    const rec = buildRecord({
      salt: result.salt,
      kdf: result.kdf,
      encrypted: result.payload,
    });
    await saveVaultRecord(rec);

    const empty = emptyPayload();
    keyRef.current = result.key;
    payloadRef.current = empty;
    recordRef.current = rec;
    setRecord(rec);
    setEntries([]);
    setBackupCodeSets([]);
    setApiKeys([]);
    setStatus('unlocked');
  }, []);

  const unlockFn = useCallback(async (masterPassword: string) => {
    const rec = recordRef.current ?? (await loadVaultRecord());
    if (!rec) throw new Error('No vault');
    const { payload, key } = await unlockVault(
      masterPassword,
      rec.salt,
      rec.kdf as KDFParams,
      rec.encrypted
    );
    keyRef.current = key;
    payloadRef.current = payload;
    recordRef.current = rec;
    setEntries(payload.entries);
    setBackupCodeSets(payload.backupCodeSets);
    setApiKeys(payload.apiKeys);
    setStatus('unlocked');
  }, []);

  const lock = useCallback(() => {
    keyRef.current = null;
    payloadRef.current = null;
    setEntries([]);
    setBackupCodeSets([]);
    setApiKeys([]);
    setStatus(recordRef.current ? 'locked' : 'uninitialized');
  }, []);

  /* ---------- Entries ---------- */

  const addEntry = useCallback<UseVaultResult['addEntry']>(
    async (entry) => {
      const now = new Date().toISOString();
      const full: VaultEntry = { ...entry, id: newId(), createdAt: now, updatedAt: now };
      await mutatePayload((p) => ({ ...p, entries: [full, ...p.entries] }));
    },
    [mutatePayload]
  );

  const updateEntry = useCallback<UseVaultResult['updateEntry']>(
    async (id, patch) => {
      const now = new Date().toISOString();
      await mutatePayload((p) => ({
        ...p,
        entries: p.entries.map((e) =>
          e.id === id ? { ...e, ...patch, id: e.id, updatedAt: now } : e
        ),
      }));
    },
    [mutatePayload]
  );

  const deleteEntry = useCallback<UseVaultResult['deleteEntry']>(
    async (id) => {
      await mutatePayload((p) => ({
        ...p,
        entries: p.entries.filter((e) => e.id !== id),
      }));
    },
    [mutatePayload]
  );

  /* ---------- Backup code sets ---------- */

  const addBackupCodeSet = useCallback<UseVaultResult['addBackupCodeSet']>(
    async (set) => {
      const now = new Date().toISOString();
      const full: BackupCodeSet = { ...set, id: newId(), createdAt: now, updatedAt: now };
      await mutatePayload((p) => ({
        ...p,
        backupCodeSets: [full, ...p.backupCodeSets],
      }));
    },
    [mutatePayload]
  );

  const updateBackupCodeSet = useCallback<UseVaultResult['updateBackupCodeSet']>(
    async (id, patch) => {
      const now = new Date().toISOString();
      await mutatePayload((p) => ({
        ...p,
        backupCodeSets: p.backupCodeSets.map((s) =>
          s.id === id ? { ...s, ...patch, id: s.id, updatedAt: now } : s
        ),
      }));
    },
    [mutatePayload]
  );

  const deleteBackupCodeSet = useCallback<UseVaultResult['deleteBackupCodeSet']>(
    async (id) => {
      await mutatePayload((p) => ({
        ...p,
        backupCodeSets: p.backupCodeSets.filter((s) => s.id !== id),
      }));
    },
    [mutatePayload]
  );

  /* ---------- API keys ---------- */

  const addApiKey = useCallback<UseVaultResult['addApiKey']>(
    async (key) => {
      const now = new Date().toISOString();
      const full: ApiKeyEntry = { ...key, id: newId(), createdAt: now, updatedAt: now };
      await mutatePayload((p) => ({ ...p, apiKeys: [full, ...p.apiKeys] }));
    },
    [mutatePayload]
  );

  const updateApiKey = useCallback<UseVaultResult['updateApiKey']>(
    async (id, patch) => {
      const now = new Date().toISOString();
      await mutatePayload((p) => ({
        ...p,
        apiKeys: p.apiKeys.map((k) =>
          k.id === id ? { ...k, ...patch, id: k.id, updatedAt: now } : k
        ),
      }));
    },
    [mutatePayload]
  );

  const deleteApiKey = useCallback<UseVaultResult['deleteApiKey']>(
    async (id) => {
      await mutatePayload((p) => ({
        ...p,
        apiKeys: p.apiKeys.filter((k) => k.id !== id),
      }));
    },
    [mutatePayload]
  );

  const replaceVault = useCallback<UseVaultResult['replaceVault']>(
    async (rec, key, payload) => {
      await saveVaultRecord(rec);
      recordRef.current = rec;
      keyRef.current = key;
      payloadRef.current = payload;
      setRecord(rec);
      setEntries(payload.entries);
      setBackupCodeSets(payload.backupCodeSets);
      setApiKeys(payload.apiKeys);
      setStatus('unlocked');
    },
    []
  );

  const clearVault = useCallback(async () => {
    await deleteVaultRecord();
    keyRef.current = null;
    payloadRef.current = null;
    recordRef.current = null;
    setRecord(null);
    setEntries([]);
    setBackupCodeSets([]);
    setApiKeys([]);
    setStatus('uninitialized');
  }, []);

  return {
    status,
    entries,
    backupCodeSets,
    apiKeys,
    record,
    createVault: createVaultFn,
    unlock: unlockFn,
    lock,
    addEntry,
    updateEntry,
    deleteEntry,
    addBackupCodeSet,
    updateBackupCodeSet,
    deleteBackupCodeSet,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    replaceVault,
    clearVault,
    refreshFromStorage,
  };
}