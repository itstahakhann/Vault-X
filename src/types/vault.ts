/**
 * Vault data model.
 *
 * SECURITY: This is the *decrypted* in-memory shape. It must never be
 * persisted in this form. Persistence always goes through the encrypted
 * vault envelope (see storage/vaultStore.ts).
 */

export type Category =
  | 'Personal'
  | 'Work'
  | 'School'
  | 'Finance'
  | 'Development'
  | 'Social'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Personal',
  'Work',
  'School',
  'Finance',
  'Development',
  'Social',
  'Other',
];

export interface VaultEntry {
  id: string;
  title: string;
  website: string;
  username: string;
  password: string;
  notes: string;
  category: Category;
  favorite: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * The full decrypted vault payload. Versioned so future migrations are
 * straightforward.
 */
export interface VaultPayload {
  version: 1;
  entries: VaultEntry[];
}

/** Encrypted blob containing a single ciphertext+iv for a payload. */
export interface EncryptedBlob {
  ciphertext: string; // base64
  iv: string;         // base64
}

/**
 * Top-level record persisted in IndexedDB.
 *
 * Contains only cryptographic metadata (salt, KDF params) and the
 * encrypted payload. No plaintext ever lives here.
 */
export interface VaultRecord {
  id: 'vault'; // single-row store
  formatVersion: 1;
  kdf: {
    name: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
  };
  cipher: {
    name: 'AES-GCM';
    length: 256;
  };
  salt: string; // base64
  encrypted: EncryptedBlob;
  createdAt: string;
  updatedAt: string;
}

/** Exportable encrypted backup envelope. */
export interface VaultExport {
  app: 'VaultX';
  formatVersion: 1;
  exportedAt: string;
  record: VaultRecord;
}