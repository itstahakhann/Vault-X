import { deriveKey, DEFAULT_KDF, type KDFParams } from './keyDerivation';
import { encryptBytes, decryptBytes } from './encryption';
import { generateSalt } from './random';
import {
  migratePayload,
  type VaultPayload,
  type EncryptedBlob,
} from '../types/vault';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface EncryptedVault {
  payload: EncryptedBlob;
  kdf: KDFParams;
  salt: string;
}

export interface CreateVaultResult extends EncryptedVault {
  key: CryptoKey;
}

/**
 * Create a brand-new vault: generate salt, derive key, encrypt an
 * empty v2 payload. Returns the key so the session can stay unlocked.
 */
export async function createVault(masterPassword: string): Promise<CreateVaultResult> {
  const salt = generateSalt();
  const key = await deriveKey(masterPassword, salt, DEFAULT_KDF);
  const empty: VaultPayload = {
    version: 2,
    entries: [],
    backupCodeSets: [],
    apiKeys: [],
  };
  const payload = await encryptPayload(key, empty);
  return { payload, kdf: DEFAULT_KDF, salt, key };
}

/** Encrypt a full vault payload with the given key. */
export async function encryptPayload(
  key: CryptoKey,
  payload: VaultPayload
): Promise<EncryptedBlob> {
  const json = JSON.stringify(payload);
  return encryptBytes(key, encoder.encode(json));
}

/**
 * Derive key from existing vault metadata and attempt to decrypt.
 * Runs migration to the current payload version on success.
 * On failure, throws a generic error — callers must not surface
 * cryptographic details to users.
 */
export async function unlockVault(
  masterPassword: string,
  salt: string,
  kdf: KDFParams,
  encrypted: EncryptedBlob
): Promise<{ payload: VaultPayload; key: CryptoKey }> {
  const key = await deriveKey(masterPassword, salt, kdf);
  const bytes = await decryptBytes(key, encrypted);
  const parsed = JSON.parse(decoder.decode(bytes));
  const payload = migratePayload(parsed);
  return { payload, key };
}

export { deriveKey, DEFAULT_KDF, generateSalt };
export type { KDFParams };