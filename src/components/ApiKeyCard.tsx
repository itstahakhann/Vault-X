import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import type { ApiKeyEntry } from '../types/vault';
import { copyToClipboard, scheduleClipboardClear } from '../utils/clipboard';

interface Props {
  entry: ApiKeyEntry;
  onEdit: (entry: ApiKeyEntry) => void;
  onDelete: (entry: ApiKeyEntry) => void;
}

const REVEAL_TIMEOUT_MS = 15_000;

function maskKey(key: string): string {
  if (!key) return '';
  const prefixMatch = key.match(/^(sk-|pk-|ghp_|gho_|ghu_|ghs_|ghr_|xox[baprs]-|AKIA|ASIA)/i);
  const prefix = prefixMatch ? prefixMatch[0] : key.slice(0, Math.min(4, key.length));
  const bullets = '•'.repeat(Math.min(24, Math.max(8, key.length - prefix.length)));
  return `${prefix}${bullets}`;
}

function isExpired(entry: ApiKeyEntry): boolean {
  if (!entry.expiresAt) return false;
  const t = Date.parse(entry.expiresAt);
  return !Number.isNaN(t) && t < Date.now();
}

function isExpiringSoon(entry: ApiKeyEntry): boolean {
  if (!entry.expiresAt) return false;
  const t = Date.parse(entry.expiresAt);
  if (Number.isNaN(t)) return false;
  const days = (t - Date.now()) / 86_400_000;
  return days >= 0 && days <= 30;
}

export default function ApiKeyCard({ entry, onEdit, onDelete }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!revealed) return;
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setRevealed(false), REVEAL_TIMEOUT_MS);
    return () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, [revealed]);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(entry.key);
    scheduleClipboardClear(entry.key);
    setCopiedKey(true);
    window.setTimeout(() => setCopiedKey(false), 1500);
  }, [entry.key]);

  const envBadgeClass = {
    dev: 'border-border-subtle text-text-muted',
    staging: 'border-warning/40 text-warning',
    prod: 'border-danger/40 text-danger',
    other: 'border-border-subtle text-text-muted',
  }[entry.environment];

  const expired = isExpired(entry);
  const expiring = !expired && isExpiringSoon(entry);

  return (
    <article className="rounded-lg border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-border-strong">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text-primary">
            {entry.label || 'Untitled'}
          </h3>
          <p className="truncate text-xs text-text-muted">{entry.service || '—'}</p>
        </div>
        <span
          className={
            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ' +
            envBadgeClass
          }
        >
          {entry.environment}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-base px-2 py-1.5">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-text-primary">
          {revealed ? entry.key : maskKey(entry.key)}
        </code>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? 'Hide key' : 'Reveal key'}
          className="shrink-0 rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy API key"
          className="shrink-0 rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {copiedKey ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
      </div>

      {revealed && (
        <p className="mt-1 text-[10px] text-text-muted">Auto-hides in 15 seconds.</p>
      )}

      {entry.expiresAt && (
        <p
          className={
            'mt-2 text-xs ' +
            (expired ? 'text-danger' : expiring ? 'text-warning' : 'text-text-muted')
          }
        >
          {expired
            ? `Expired ${new Date(entry.expiresAt).toLocaleDateString()}`
            : expiring
            ? `Expires soon: ${new Date(entry.expiresAt).toLocaleDateString()}`
            : `Expires ${new Date(entry.expiresAt).toLocaleDateString()}`}
        </p>
      )}

      {entry.notes && (
        <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{entry.notes}</p>
      )}

      <div className="mt-3 flex items-center justify-end gap-0.5">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          aria-label="Edit"
          className="rounded p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry)}
          aria-label="Delete"
          className="rounded p-1.5 text-text-muted hover:bg-bg-hover hover:text-danger focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}