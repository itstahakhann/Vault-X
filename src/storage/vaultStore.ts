/**
 * IndexedDB persistence for the encrypted vault.
 *
 * SECURITY: Only the VaultRecord (salt + KDF params + ciphertext) is
 * ever written to disk. The master password and derived key are never
 * touched here.
 */

import type { VaultRecord, EncryptedBlob, VaultExport } from '../types/vault';
import { DEFAULT_KDF, type KDFParams } from '../crypto/keyDerivation';

const DB_NAME = 'vaultx';
const DB_VERSION = 1;
const STORE = 'vault';
const RECORD_ID = 'vault';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const store = transaction.objectStore(STORE);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IDB op failed'));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          reject(transaction.error ?? new Error('IDB tx failed'));
          db.close();
        };
      })
  );
}

export async function hasVault(): Promise<boolean> {
  try {
    const record = await tx<VaultRecord | undefined>('readonly', (s) =>
      s.get(RECORD_ID)
    );
    return !!record;
  } catch {
    return false;
  }
}

export async function loadVaultRecord(): Promise<VaultRecord | null> {
  const record = await tx<VaultRecord | undefined>('readonly', (s) =>
    s.get(RECORD_ID)
  );
  return record ?? null;
}

export async function saveVaultRecord(record: VaultRecord): Promise<void> {
  await tx('readwrite', (s) => s.put(record));
}

export async function deleteVaultRecord(): Promise<void> {
  await tx('readwrite', (s) => s.delete(RECORD_ID));
}

/** Construct a new record from crypto results. */
export function buildRecord(args: {
  salt: string;
  kdf: KDFParams;
  encrypted: EncryptedBlob;
  existing?: VaultRecord | null;
}): VaultRecord {
  const now = new Date().toISOString();
  return {
    id: RECORD_ID,
    formatVersion: 1,
    kdf: args.kdf ?? DEFAULT_KDF,
    cipher: { name: 'AES-GCM', length: 256 },
    salt: args.salt,
    encrypted: args.encrypted,
    createdAt: args.existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/** Validate an imported export envelope. Throws on malformed data. */
export function validateExport(data: unknown): VaultExport {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup file');
  }
  const d = data as Record<string, unknown>;
  if (d.app !== 'VaultX') throw new Error('Not a VaultX backup');
  if (d.formatVersion !== 1) throw new Error('Unsupported backup version');
  const record = d.record as Record<string, unknown> | undefined;
  if (!record || typeof record !== 'object') throw new Error('Missing vault record');

  const { salt, kdf, encrypted } = record as {
    salt?: unknown;
    kdf?: unknown;
    encrypted?: unknown;
  };
  if (typeof salt !== 'string' || !salt) throw new Error('Missing salt');
  if (!kdf || typeof kdf !== 'object') throw new Error('Missing KDF params');
  if (!encrypted || typeof encrypted !== 'object') throw new Error('Missing ciphertext');

  const enc = encrypted as Record<string, unknown>;
  if (typeof enc.ciphertext !== 'string' || typeof enc.iv !== 'string') {
    throw new Error('Invalid ciphertext');
  }

  const k = kdf as Record<string, unknown>;
  if (k.name !== 'PBKDF2' || k.hash !== 'SHA-256' || typeof k.iterations !== 'number') {
    throw new Error('Unsupported KDF');
  }

  return data as VaultExport;
}