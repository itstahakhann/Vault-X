import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Pencil, Trash2 } from 'lucide-react';
import type { BackupCodeSet } from '../types/vault';
import { copyToClipboard, scheduleClipboardClear } from '../utils/clipboard';

interface Props {
  set: BackupCodeSet;
  onEdit: (set: BackupCodeSet) => void;
  onDelete: (set: BackupCodeSet) => void;
}

const REVEAL_TIMEOUT_MS = 15_000;

export default function BackupCodeCard({ set, onEdit, onDelete }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedOne, setCopiedOne] = useState<string | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!revealed) return;
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setRevealed(false), REVEAL_TIMEOUT_MS);
    return () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, [revealed]);

  const handleCopyAll = useCallback(async () => {
    const text = set.codes.join('\n');
    await copyToClipboard(text);
    scheduleClipboardClear(text);
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1500);
  }, [set.codes]);

  const handleCopyOne = useCallback(async (code: string) => {
    await copyToClipboard(code);
    scheduleClipboardClear(code);
    setCopiedOne(code);
    window.setTimeout(() => setCopiedOne(null), 1500);
  }, []);

  return (
    <article className="rounded-lg border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-muted text-accent"
        >
          <KeyRound size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-text-primary">
              {set.label || 'Untitled'}
            </h3>
            <p className="truncate text-xs text-text-muted">
              {set.service || '—'} · {set.codes.length} codes
            </p>
          </div>

          <div className="mt-3 rounded-md border border-border-subtle bg-bg-base p-2">
            {revealed ? (
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {set.codes.map((code, i) => (
                  <li key={`${code}-${i}`} className="flex items-center justify-between gap-2">
                    <code className="truncate font-mono text-xs text-text-primary">
                      {code}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyOne(code)}
                      aria-label={`Copy code ${i + 1}`}
                      className="rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {copiedOne === code ? (
                        <Check size={12} className="text-success" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center font-mono text-xs text-text-muted">
                ••••••••  ••••••••  ••••••••  ••••••••
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
              {revealed ? 'Hide' : 'Reveal'}
            </button>
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1 text-xs text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {copiedAll ? (
                <Check size={12} className="text-success" />
              ) : (
                <Copy size={12} />
              )}
              Copy all
            </button>
            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onEdit(set)}
                aria-label="Edit"
                className="rounded p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(set)}
                aria-label="Delete"
                className="rounded p-1.5 text-text-muted hover:bg-bg-hover hover:text-danger focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}