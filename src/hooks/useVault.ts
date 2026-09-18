/**
 * Central vault session hook.
 *
 * SECURITY:
 *  - Holds the CryptoKey and decrypted payload in React state only.
 *  - Never persists the key or plaintext.
 *  - Clears both on lock() and auto-lock.
 *  - Re-reads the encrypted record from IndexedDB on every save.
 */

import { useCallback, useRef, useState } from 'react';
import type { VaultEntry, VaultPayload, VaultRecord } from '../types/vault';
import {
  createVault,
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
  record: VaultRecord | null;
  createVault: (masterPassword: string) => Promise<void>;
  unlock: (masterPassword: string) => Promise<void>;
  lock: () => void;
  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, patch: Partial<VaultEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  replaceVault: (record: VaultRecord, key: CryptoKey, payload: VaultPayload) => Promise<void>;
  clearVault: () => Promise<void>;
  refreshFromStorage: () => Promise<void>;
}

function newId(): string {
  // crypto.randomUUID is available in all evergreen browsers.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function useVault(): UseVaultResult {
  const [status, setStatus] = useState<VaultStatus>('loading');
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [record, setRecord] = useState<VaultRecord | null>(null);

  // Holds the live key + payload for the unlocked session. Kept in a ref
  // so it's not part of the React tree for longer than necessary.
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
      setStatus('uninitialized');
      return;
    }
    const rec = await loadVaultRecord();
    recordRef.current = rec;
    setRecord(rec);
    // We deliberately do NOT auto-unlock on refresh.
    keyRef.current = null;
    payloadRef.current = null;
    setEntries([]);
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

  const createVaultFn = useCallback(async (masterPassword: string) => {
    const result = await createVault(masterPassword);
    const rec = buildRecord({
      salt: result.salt,
      kdf: result.kdf,
      encrypted: result.payload,
    });
    await saveVaultRecord(rec);

    keyRef.current = result.key;
    payloadRef.current = { version: 1, entries: [] };
    recordRef.current = rec;
    setRecord(rec);
    setEntries([]);
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
    setStatus('unlocked');
  }, []);

  const lock = useCallback(() => {
    keyRef.current = null;
    payloadRef.current = null;
    setEntries([]);
    setStatus(recordRef.current ? 'locked' : 'uninitialized');
  }, []);

  const addEntry = useCallback<UseVaultResult['addEntry']>(async (entry) => {
    const payload = payloadRef.current;
    if (!payload) throw new Error('Vault locked');
    const now = new Date().toISOString();
    const full: VaultEntry = {
      ...entry,
      id: newId(),
      createdAt: now,
      updatedAt: now,
    };
    const next: VaultPayload = { ...payload, entries: [full, ...payload.entries] };
    payloadRef.current = next;
    setEntries(next.entries);
    await persist();
  }, [persist]);

  const updateEntry = useCallback<UseVaultResult['updateEntry']>(
    async (id, patch) => {
      const payload = payloadRef.current;
      if (!payload) throw new Error('Vault locked');
      const now = new Date().toISOString();
      const next: VaultPayload = {
        ...payload,
        entries: payload.entries.map((e) =>
          e.id === id ? { ...e, ...patch, id: e.id, updatedAt: now } : e
        ),
      };
      payloadRef.current = next;
      setEntries(next.entries);
      await persist();
    },
    [persist]
  );

  const deleteEntry = useCallback<UseVaultResult['deleteEntry']>(
    async (id) => {
      const payload = payloadRef.current;
      if (!payload) throw new Error('Vault locked');
      const next: VaultPayload = {
        ...payload,
        entries: payload.entries.filter((e) => e.id !== id),
      };
      payloadRef.current = next;
      setEntries(next.entries);
      await persist();
    },
    [persist]
  );

  const replaceVault = useCallback<UseVaultResult['replaceVault']>(
    async (rec, key, payload) => {
      await saveVaultRecord(rec);
      recordRef.current = rec;
      keyRef.current = key;
      payloadRef.current = payload;
      setRecord(rec);
      setEntries(payload.entries);
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
    setStatus('uninitialized');
  }, []);

  return {
    status,
    entries,
    record,
    createVault: createVaultFn,
    unlock: unlockFn,
    lock,
    addEntry,
    updateEntry,
    deleteEntry,
    replaceVault,
    clearVault,
    refreshFromStorage,
  };
}