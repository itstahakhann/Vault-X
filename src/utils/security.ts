/**
 * Vault security analysis.
 *
 * SECURITY: Runs entirely in memory against the decrypted vault. No
 * password values are ever sent anywhere, logged, or rendered. Only
 * aggregate counts are returned.
 */

import type { VaultEntry } from '../types/vault';

export interface SecurityReport {
  total: number;
  strong: number;
  weak: number;
  reused: number;
  old: number;
}

const OLD_THRESHOLD_DAYS = 365;

function scorePassword(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (pw.length >= 16) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export function analyzeVault(entries: VaultEntry[]): SecurityReport {
  const now = Date.now();
  const passwordCounts = new Map<string, number>();

  let strong = 0;
  let weak = 0;
  let old = 0;

  for (const e of entries) {
    const pw = e.password ?? '';
    if (scorePassword(pw) >= 5 && pw.length >= 12) strong++;
    else if (scorePassword(pw) <= 3 || pw.length < 10) weak++;

    passwordCounts.set(pw, (passwordCounts.get(pw) ?? 0) + 1);

    const updated = Date.parse(e.updatedAt);
    if (!Number.isNaN(updated)) {
      const ageDays = (now - updated) / 86_400_000;
      if (ageDays > OLD_THRESHOLD_DAYS) old++;
    }
  }

  let reused = 0;
  for (const count of passwordCounts.values()) {
    if (count > 1) reused += count;
  }

  return { total: entries.length, strong, weak, reused, old };
}
