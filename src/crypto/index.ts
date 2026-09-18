import { deriveKey, DEFAULT_KDF, type KDFParams } from './keyDerivation';
import { encryptBytes, decryptBytes } from './encryption';
import { generateSalt } from './random';
import type { VaultPayload, EncryptedBlob } from '../types/vault';

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
 * Create a brand-new vault: generate salt, derive key, encrypt an empty
 * payload. Returns the key so the session can stay unlocked.
 */
export async function createVault(masterPassword: string): Promise<CreateVaultResult> {
  const salt = generateSalt();
  const key = await deriveKey(masterPassword, salt, DEFAULT_KDF);
  const payload = await encryptPayload(key, { version: 1, entries: [] });
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
 * On success returns the payload and the key. On failure, throws a
 * generic error — callers must not surface crypto details.
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
  if (!isVaultPayload(parsed)) {
    throw new Error('Invalid vault payload');
  }
  return { payload: parsed, key };
}

export function isVaultPayload(x: unknown): x is VaultPayload {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  if (p.version !== 1) return false;
  if (!Array.isArray(p.entries)) return false;
  return true;
}

export { deriveKey, DEFAULT_KDF, generateSalt };
export type { KDFParams };