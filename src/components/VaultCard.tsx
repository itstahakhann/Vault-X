import { useCallback, useState } from 'react';
import { Check, Copy, Eye, EyeOff, Pencil, Star, Trash2 } from 'lucide-react';
import type { VaultEntry } from '../types/vault';
import { copyToClipboard, scheduleClipboardClear } from '../utils/clipboard';

interface Props {
  entry: VaultEntry;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (entry: VaultEntry) => void;
  onToggleFavorite: (entry: VaultEntry) => void;
}

export default function VaultCard({ entry, onEdit, onDelete, onToggleFavorite }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'password' | 'username' | null>(null);

  const handleCopy = useCallback(async (text: string, field: 'password' | 'username') => {
    if (!text) return;
    await copyToClipboard(text);
    if (field === 'password') scheduleClipboardClear(text);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const initial = (entry.title || '?').trim().charAt(0).toUpperCase();

  return (
    <article className="group rounded-lg border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-border-strong hover:bg-bg-elevated">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-muted text-sm font-semibold text-accent"
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-text-primary">
                {entry.title || 'Untitled'}
              </h3>
              <p className="truncate text-xs text-text-muted">
                {entry.website || entry.username || '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleFavorite(entry)}
              aria-label={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={entry.favorite}
              className="rounded p-1 text-text-muted hover:text-warning focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <Star
                size={16}
                className={entry.favorite ? 'fill-warning text-warning' : ''}
              />
            </button>
          </div>

          <div className="mt-3 space-y-1.5">
            {entry.username && (
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-text-secondary">{entry.username}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(entry.username, 'username')}
                  aria-label="Copy username"
                  className="rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {copiedField === 'username' ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <code className="truncate font-mono text-xs text-text-secondary">
                {showPassword ? entry.password : '•'.repeat(Math.min(entry.password.length, 16))}
              </code>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(entry.password, 'password')}
                  aria-label="Copy password"
                  className="rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {copiedField === 'password' ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="rounded-full border border-border-subtle bg-bg-base px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
              {entry.category}
            </span>
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => onEdit(entry)}
                aria-label="Edit entry"
                className="rounded p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(entry)}
                aria-label="Delete entry"
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