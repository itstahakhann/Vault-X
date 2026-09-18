/**
 * Password-based key derivation.
 *
 * SECURITY: PBKDF2-SHA256 with a per-vault random salt. Iteration count
 * is chosen to be a reasonable default for a browser context; future
 * migrations can raise it and re-encrypt under a new format version.
 *
 * The derived key is intentionally non-extractable: it can only be used
 * for encrypt/decrypt, not exported. It is held in memory only and never
 * persisted.
 */

export const KDF_ITERATIONS = 250_000;

export interface KDFParams {
  name: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
}

export const DEFAULT_KDF: KDFParams = {
  name: 'PBKDF2',
  hash: 'SHA-256',
  iterations: KDF_ITERATIONS,
};

/**
 * Derive an AES-GCM key from a master password.
 */
export async function deriveKey(
  password: string,
  saltB64: string,
  params: KDFParams = DEFAULT_KDF
): Promise<CryptoKey> {
  if (!password) throw new Error('Password required');

  const enc = new TextEncoder();
  const salt = base64ToBytesSafe(saltB64);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: params.iterations,
      hash: params.hash,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Local base64 decoder. Returns a plain Uint8Array; on TypeScript 5.6
 * this is directly assignable to BufferSource.
 */
function base64ToBytesSafe(b64: string): Uint8Array {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}