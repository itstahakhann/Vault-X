/**
 * Cryptographically secure randomness helpers.
 *
 * SECURITY: Never use Math.random() for salts, IVs, or passwords.
 * Always source entropy from crypto.getRandomValues().
 */

export function getRandomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('Invalid length for random bytes');
  }
  const buffer = new ArrayBuffer(length);
  const bytes = new Uint8Array(buffer);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** 16-byte salt, base64-encoded. */
export function generateSalt(): string {
  return bytesToBase64(getRandomBytes(16));
}

/** 12-byte IV for AES-GCM (NIST recommended). */
export function generateIV(): Uint8Array {
  return getRandomBytes(12);
}