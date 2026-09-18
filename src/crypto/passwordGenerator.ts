/**
 * Cryptographically secure password generator.
 *
 * SECURITY: Uses crypto.getRandomValues() only. Math.random() is never
 * used. Ensures at least one character from each enabled class is
 * present when length permits, then shuffles securely.
 */

import { getRandomBytes } from './random';

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Uniformly pick an index in [0, max) using rejection sampling to avoid
 * modulo bias.
 */
function randomIndex(max: number): number {
  if (max <= 0) throw new Error('Invalid range');
  if (max > 256) {
    // For larger ranges, use 32-bit rejection sampling.
    const limit = Math.floor(0xffffffff / max) * max;
    // Loop with 4-byte chunks.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const buf = getRandomBytes(4);
      const val =
        ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0;
      if (val < limit) return val % max;
    }
  }
  const limit = Math.floor(256 / max) * max;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const byte = getRandomBytes(1)[0];
    if (byte < limit) return byte % max;
  }
}

function pick(str: string): string {
  return str[randomIndex(str.length)];
}

export function generatePassword(options: GeneratorOptions): string {
  const { length, uppercase, lowercase, numbers, symbols } = options;

  const pools: string[] = [];
  if (uppercase) pools.push(CHARSETS.uppercase);
  if (lowercase) pools.push(CHARSETS.lowercase);
  if (numbers) pools.push(CHARSETS.numbers);
  if (symbols) pools.push(CHARSETS.symbols);

  if (pools.length === 0) {
    throw new Error('Select at least one character class');
  }

  const effectiveLength = Math.max(length, pools.length);
  const chars: string[] = [];

  // Guarantee at least one char from each enabled class.
  for (const pool of pools) chars.push(pick(pool));

  const all = pools.join('');
  while (chars.length < effectiveLength) chars.push(pick(all));

  // Secure Fisher–Yates shuffle.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

/** Rough strength estimate for the UI (not a security boundary). */
export function estimateEntropyBits(options: GeneratorOptions): number {
  let poolSize = 0;
  if (options.uppercase) poolSize += 26;
  if (options.lowercase) poolSize += 26;
  if (options.numbers) poolSize += 10;
  if (options.symbols) poolSize += CHARSETS.symbols.length;
  if (poolSize === 0) return 0;
  return Math.round(options.length * Math.log2(poolSize));
}