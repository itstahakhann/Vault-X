/**
 * Backup code generation and parsing.
 *
 * SECURITY: Uses crypto.getRandomValues() exclusively. Never Math.random().
 * Backup codes are not secret *forever* — they exist to be printed and
 * stored offline — but the generation still needs to be unpredictable.
 */

import { getRandomBytes } from '../crypto/random';

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Uniform index in [0, max) using rejection sampling. No modulo bias. */
function uniformIndex(max: number): number {
  if (max <= 0) throw new Error('Invalid range');
  const limit = Math.floor(256 / max) * max;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const byte = getRandomBytes(1)[0];
    if (byte < limit) return byte % max;
  }
}

export interface GenerateBackupCodesOptions {
  count?: number;
  length?: number;
  grouped?: boolean;
}

export interface GeneratedBackupCodes {
  codes: string[];
}

/**
 * Generate a fresh set of backup codes.
 * Default: 10 codes, 10 chars each, hyphenated in the middle.
 * That's ~50 bits of entropy per code, ~500 bits total.
 */
export function generateBackupCodes(
  options: GenerateBackupCodesOptions = {}
): GeneratedBackupCodes {
  const { count = 10, length = 10, grouped = true } = options;

  if (count < 1 || count > 100) throw new Error('Invalid code count');
  if (length < 6 || length > 32) throw new Error('Invalid code length');

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < length; j++) {
      code += ALPHANUM[uniformIndex(ALPHANUM.length)];
    }
    if (grouped && length >= 6 && length % 2 === 0) {
      const mid = Math.floor(length / 2);
      code = `${code.slice(0, mid)}-${code.slice(mid)}`;
    }
    codes.push(code);
  }
  return { codes };
}

/**
 * Parse pasted or uploaded backup codes.
 * Accepts: one per line, comma/space/tab separated, optional enumerators
 * like "1." "1)" "- ", and ignores blank lines and # comments.
 * Duplicates are removed (case-insensitive).
 */
export function parseBackupCodes(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const stripped = line.replace(/^\s*(?:\d+[\.\):]|[-*])\s*/, '');
    const parts = stripped.split(/[\s,;]+/).filter(Boolean);

    for (const part of parts) {
      const code = part.trim();
      if (!code) continue;
      const key = code.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(code);
    }
  }
  return out;
}
/**
 * Sanity check: does this look like a set of alphanumeric backup codes?
 * Rejects HTML, JSON blobs, binary garbage.
 */
export function looksLikeBackupCodes(codes: string[]): boolean {
  if (codes.length === 0) return false;
  if (codes.length > 500) return false;
  const good = codes.filter((c) => /^[A-Za-z0-9\-_]{4,40}$/.test(c)).length;
  return good / codes.length >= 0.8;
}