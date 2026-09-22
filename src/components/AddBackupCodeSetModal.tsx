import { useEffect, useMemo, useState } from 'react';
import { Upload, X } from 'lucide-react';
import type { BackupCodeSet } from '../types/vault';
import { looksLikeBackupCodes, parseBackupCodes } from '../utils/backupCodes';

interface Props {
  open: boolean;
  initial?: BackupCodeSet;
  onClose: () => void;
  onSubmit: (
    values: Omit<BackupCodeSet, 'id' | 'createdAt' | 'updatedAt'>
  ) => void | Promise<void>;
}

export default function AddBackupCodeSetModal({ open, initial, onClose, onSubmit }: Props) {
  const editing = !!initial;
  const [label, setLabel] = useState(initial?.label ?? '');
  const [service, setService] = useState(initial?.service ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [codesText, setCodesText] = useState(initial?.codes.join('\n') ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset / hydrate when the modal opens.
  useEffect(() => {
    if (!open) {
      setLabel('');
      setService('');
      setNotes('');
      setCodesText('');
      setError(null);
      setBusy(false);
    } else if (initial) {
      setLabel(initial.label);
      setService(initial.service);
      setNotes(initial.notes);
      setCodesText(initial.codes.join('\n'));
    }
  }, [open, initial]);

  // Esc to close.
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

  const parsedCodes = useMemo(
    () => (codesText ? parseBackupCodes(codesText) : []),
    [codesText]
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError(null);
    try {
      const text = await f.text();
      if (text.length > 1_000_000) throw new Error('File too large (max 1 MB)');
      setCodesText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    if (parsedCodes.length === 0) {
      setError('No codes provided');
      return;
    }
    if (!looksLikeBackupCodes(parsedCodes)) {
      setError('This does not look like a valid list of backup codes.');
      return;
    }
    if (parsedCodes.length > 200) {
      setError('Too many codes (max 200 per set)');
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        label: label.trim(),
        service: service.trim(),
        codes: parsedCodes,
        notes: notes.trim(),
        source: editing ? initial!.source : 'imported',
      });
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
      aria-labelledby="bcs-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-auto flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg border border-border-subtle bg-bg-elevated shadow-xl">
        {/* Fixed header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle p-4">
          <h2 id="bcs-title" className="text-base font-semibold text-text-primary">
            {editing ? 'Edit Backup Codes' : 'Add Backup Codes'}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="bcs-label"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Label <span className="text-danger">*</span>
                </label>
                <input
                  id="bcs-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="GitHub 2FA"
                  required
                  className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label
                  htmlFor="bcs-service"
                  className="mb-1.5 block text-sm font-medium text-text-secondary"
                >
                  Service
                </label>
                <input
                  id="bcs-service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="github.com"
                  className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="bcs-codes"
                  className="block text-sm font-medium text-text-secondary"
                >
                  Codes <span className="text-danger">*</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-accent hover:text-accent-hover">
                  <Upload size={12} />
                  Upload file
                  <input
                    type="file"
                    accept=".txt,.csv,text/plain,text/csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </div>
              <textarea
                id="bcs-codes"
                value={codesText}
                onChange={(e) => setCodesText(e.target.value)}
                rows={8}
                placeholder={
                  'Paste one code per line, or comma-separated.\n\nABCD-EFGH\nIJKL-MNOP\n...'
                }
                className="w-full resize-none rounded-md border border-border-subtle bg-bg-base px-3 py-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {parsedCodes.length > 0 && (
              <div className="rounded-md border border-border-subtle bg-bg-base p-3">
                <p className="mb-2 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">
                    {parsedCodes.length}
                  </span>{' '}
                  codes detected
                </p>
                <ul className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto font-mono text-xs text-text-primary">
                  {parsedCodes.slice(0, 100).map((c, i) => (
                    <li key={`${c}-${i}`}>{c}</li>
                  ))}
                  {parsedCodes.length > 100 && (
                    <li className="text-text-muted">
                      …and {parsedCodes.length - 100} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div>
              <label
                htmlFor="bcs-notes"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Notes
              </label>
              <textarea
                id="bcs-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-text-secondary">
              <strong className="text-warning">Save these somewhere safe.</strong> Backup
              codes are usually the last-resort way back into an account. VaultX encrypts
              them on this device, but they're also worth printing or storing offline.
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
              {busy ? 'Saving...' : editing ? 'Save Changes' : 'Add Codes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}