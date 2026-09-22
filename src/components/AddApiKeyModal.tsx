import { useEffect, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import type { ApiEnvironment, ApiKeyEntry } from '../types/vault';
import { API_ENVIRONMENTS } from '../types/vault';

interface Props {
  open: boolean;
  initial?: ApiKeyEntry;
  onClose: () => void;
  onSubmit: (
    values: Omit<ApiKeyEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => void | Promise<void>;
}

export default function AddApiKeyModal({ open, initial, onClose, onSubmit }: Props) {
  const editing = !!initial;
  const [label, setLabel] = useState(initial?.label ?? '');
  const [key, setKey] = useState(initial?.key ?? '');
  const [service, setService] = useState(initial?.service ?? '');
  const [environment, setEnvironment] = useState<ApiEnvironment>(
    initial?.environment ?? 'dev'
  );
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setLabel('');
      setKey('');
      setService('');
      setEnvironment('dev');
      setExpiresAt('');
      setNotes('');
      setShowKey(false);
      setError(null);
      setBusy(false);
    } else if (initial) {
      setLabel(initial.label);
      setKey(initial.key);
      setService(initial.service);
      setEnvironment(initial.environment);
      setExpiresAt(initial.expiresAt);
      setNotes(initial.notes);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    if (!key) {
      setError('API key is required');
      return;
    }
    if (key.length > 8192) {
      setError('API key is unreasonably long (max 8 KB)');
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        label: label.trim(),
        key,
        service: service.trim(),
        environment,
        expiresAt,
        notes: notes.trim(),
      });
      setKey('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ak-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-auto flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-border-subtle bg-bg-elevated shadow-xl">
        {/* Fixed header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle p-4">
          <h2 id="ak-title" className="text-base font-semibold text-text-primary">
            {editing ? 'Edit API Key' : 'Add API Key'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <label
                htmlFor="ak-label"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Label <span className="text-danger">*</span>
              </label>
              <input
                id="ak-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Stripe Production"
                required
                autoFocus
                className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label
                htmlFor="ak-key"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                API Key <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="ak-key"
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 pr-10 font-mono text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Hide' : 'Show'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="ak-service"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Service
                </label>
                <input
                  id="ak-service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Stripe"
                  className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="ak-env"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Environment
                </label>
                <select
                  id="ak-env"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as ApiEnvironment)}
                  className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {API_ENVIRONMENTS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="ak-expires"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Expiration date
              </label>
              <input
                id="ak-expires"
                type="date"
                value={expiresAt ? expiresAt.slice(0, 10) : ''}
                onChange={(e) =>
                  setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')
                }
                className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label
                htmlFor="ak-notes"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Notes
              </label>
              <textarea
                id="ak-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          {/* Fixed footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border-subtle p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            >
              {busy ? 'Saving...' : editing ? 'Save Changes' : 'Add Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}