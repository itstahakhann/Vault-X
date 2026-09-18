/**
 * AES-GCM authenticated encryption.
 *
 * SECURITY:
 *  - AES-GCM provides confidentiality AND integrity/authentication.
 *  - A fresh random IV is generated for EVERY encryption operation.
 *  - IVs are 12 bytes (NIST SP 800-38D recommendation for GCM).
 *  - The ciphertext is base64-encoded for storage.
 *  - Decryption failure (bad password / tampered data) throws; callers
 *    must not expose the underlying error to users.
 */

import { generateIV, bytesToBase64, base64ToBytes } from './random';
import type { EncryptedBlob } from '../types/vault';

export async function encryptBytes(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<EncryptedBlob> {
  const iv = generateIV();
  // Copy into an ArrayBuffer-backed Uint8Array for the Web Crypto call.
  const plainBuf = new Uint8Array(plaintext).buffer;
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plainBuf
  );
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuf)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptBytes(
  key: CryptoKey,
  blob: EncryptedBlob
): Promise<Uint8Array> {
  const iv = base64ToBytes(blob.iv);
  const ciphertext = base64ToBytes(blob.ciphertext);
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new Uint8Array(plaintextBuf);
}