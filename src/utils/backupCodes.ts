/**
 * Backup code generation and parsing.
 *
 * SECURITY: Uses crypto.getRandomValues() exclusively. Never Math.random().
 */

import { getRandomBytes } from '../crypto/random';

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

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
      code = code.slice(0, mid) + '-' + code.slice(mid);
    }
    codes.push(code);
  }
  return { codes };
}

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

export function looksLikeBackupCodes(codes: string[]): boolean {
  if (codes.length === 0) return false;
  if (codes.length > 500) return false;
  const good = codes.filter((c) => /^[A-Za-z0-9\-_]{4,40}$/.test(c)).length;
  return good / codes.length >= 0.8;
}
