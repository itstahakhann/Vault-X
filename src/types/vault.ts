/**
 * Vault data model.
 *
 * SECURITY: This is the *decrypted* in-memory shape. It must never be
 * persisted in this form. Persistence always goes through the encrypted
 * vault envelope (see storage/vaultStore.ts).
 *
 * Everything below lives inside the encrypted payload that is stored
 * on the user's device (IndexedDB / Chromium profile). There is no
 * backend.
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
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ *
 * Backup Codes
 * ------------------------------------------------------------------ */

export interface BackupCodeSet {
  id: string;
  /** Human label, e.g. "GitHub 2FA" */
  label: string;
  /** Optional service for grouping, e.g. "github.com" */
  service: string;
  /** The codes themselves. Stored inside the encrypted payload. */
  codes: string[];
  /** Free-form note */
  notes: string;
  /** How the codes were obtained */
  source: 'generated' | 'imported' | 'manual';
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ *
 * API Keys
 * ------------------------------------------------------------------ */

export type ApiEnvironment = 'dev' | 'staging' | 'prod' | 'other';

export const API_ENVIRONMENTS: ApiEnvironment[] = ['dev', 'staging', 'prod', 'other'];

export interface ApiKeyEntry {
  id: string;
  /** Human label, e.g. "Stripe Production" */
  label: string;
  /** The secret itself. Encrypted at rest as part of the payload. */
  key: string;
  /** Provider, e.g. "OpenAI", "AWS", "GitHub" */
  service: string;
  environment: ApiEnvironment;
  /** ISO date string, or empty string for "no expiration" */
  expiresAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ *
 * Payload
 * ------------------------------------------------------------------ */

/**
 * The full decrypted vault payload.
 *
 * Version 2 added: backupCodeSets, apiKeys.
 * Migration from v1: fill in empty arrays. See migratePayload().
 */
export interface VaultPayload {
  version: 2;
  entries: VaultEntry[];
  backupCodeSets: BackupCodeSet[];
  apiKeys: ApiKeyEntry[];
}

/** Legacy version-1 payload (kept only for migration). */
export interface VaultPayloadV1 {
  version: 1;
  entries: VaultEntry[];
}

/**
 * Migrate any older payload shape to the current version.
 * Never mutates the input; returns a new object.
 */
export function migratePayload(raw: unknown): VaultPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid vault payload');
  }
  const p = raw as Record<string, unknown>;

  if (p.version === 1) {
    const v1 = raw as VaultPayloadV1;
    return {
      version: 2,
      entries: Array.isArray(v1.entries) ? v1.entries : [],
      backupCodeSets: [],
      apiKeys: [],
    };
  }

  if (p.version !== 2) {
    throw new Error('Unsupported vault payload version');
  }

  const v2 = raw as VaultPayload;
  return {
    version: 2,
    entries: Array.isArray(v2.entries) ? v2.entries : [],
    backupCodeSets: Array.isArray(v2.backupCodeSets) ? v2.backupCodeSets : [],
    apiKeys: Array.isArray(v2.apiKeys) ? v2.apiKeys : [],
  };
}

/** Encrypted blob containing a single ciphertext+iv for a payload. */
export interface EncryptedBlob {
  ciphertext: string;
  iv: string;
}

export interface VaultRecord {
  id: 'vault';
  formatVersion: 1;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number };
  cipher: { name: 'AES-GCM'; length: 256 };
  salt: string;
  encrypted: EncryptedBlob;
  createdAt: string;
  updatedAt: string;
}

export interface VaultExport {
  app: 'VaultX';
  formatVersion: 1;
  exportedAt: string;
  record: VaultRecord;
}