import { useRef } from 'react';
import { Download, Lock, Trash2, Upload, X } from 'lucide-react';
import type { VaultRecord } from '../types/vault';

export interface AutoLockOption {
  label: string;
  minutes: number | null;
}

export const AUTO_LOCK_OPTIONS: AutoLockOption[] = [
  { label: '1 minute', minutes: 1 },
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: 'Never', minutes: null },
];

interface Props {
  open: boolean;
  onClose: () => void;
  autoLockMinutes: number | null;
  onAutoLockChange: (minutes: number | null) => void;
  onLockNow: () => void;
  onExport: () => void;
  onRequestImport: () => void;
  onRequestClear: () => void;
}

export default function SettingsPanel({
  open,
  onClose,
  autoLockMinutes,
  onAutoLockChange,
  onLockNow,
  onExport,
  onRequestImport,
  onRequestClear,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-lg border border-border-subtle bg-bg-elevated p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="settings-title" className="text-base font-semibold text-text-primary">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Security
            </h3>
            <div className="space-y-3 rounded-md border border-border-subtle bg-bg-surface p-3">
              <div>
                <label htmlFor="auto-lock" className="mb-1 block text-sm text-text-secondary">
                  Auto-lock timeout
                </label>
                <select
                  id="auto-lock"
                  value={autoLockMinutes === null ? 'never' : String(autoLockMinutes)}
                  onChange={(e) => {
                    const v = e.target.value;
                    onAutoLockChange(v === 'never' ? null : Number(v));
                  }}
                  className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {AUTO_LOCK_OPTIONS.map((o) => (
                    <option
                      key={o.label}
                      value={o.minutes === null ? 'never' : String(o.minutes)}
                    >
                      {o.label}
                    </option>
                  ))}
                </select>
                {autoLockMinutes === null && (
                  <p className="mt-2 text-xs text-warning">
                    Disabling auto-lock reduces protection if you leave your device unattended.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onLockNow}
                className="inline-flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Lock size={14} />
                Lock Vault Now
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Vault
            </h3>
            <div className="space-y-2 rounded-md border border-border-subtle bg-bg-surface p-3">
              <button
                type="button"
                onClick={onExport}
                className="inline-flex w-full items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Download size={14} />
                Export Encrypted Vault
              </button>
              <button
                type="button"
                onClick={onRequestImport}
                className="inline-flex w-full items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Upload size={14} />
                Import Encrypted Vault
              </button>
              <button
                type="button"
                onClick={onRequestClear}
                className="inline-flex w-full items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm text-danger hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Trash2 size={14} />
                Clear Local Vault
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              About
            </h3>
            <div className="space-y-2 rounded-md border border-border-subtle bg-bg-surface p-3 text-sm text-text-secondary">
              <p>
                <span className="text-text-muted">Version:</span> 1.0.0
              </p>
              <p className="leading-relaxed">
                VaultX is local-first. Your passwords are encrypted in your browser and
                stored locally on your device. The application does not send your vault
                contents to a server. Your master password is never stored.
              </p>
              <p className="text-xs text-text-muted">
                Educational open-source software. Not professionally security-audited.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Re-export the record type so callers can use it if needed. */
export type { VaultRecord };