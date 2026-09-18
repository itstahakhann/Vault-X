import { useEffect } from 'react';
import { X } from 'lucide-react';
import EntryForm, { type EntryFormValues } from './EntryForm';
import type { VaultEntry } from '../types/vault';

interface Props {
  open: boolean;
  entry: VaultEntry | null;
  onClose: () => void;
  onSubmit: (values: EntryFormValues) => void | Promise<void>;
  onDelete: () => void;
}

export default function EditEntryModal({ open, entry, onClose, onSubmit, onDelete }: Props) {
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

  if (!open || !entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-border-subtle bg-bg-elevated p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="edit-title" className="text-base font-semibold text-text-primary">
            Edit Password
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
        <EntryForm
          initial={entry}
          submitLabel="Save Changes"
          onCancel={onClose}
          onDelete={onDelete}
          onSubmit={async (values) => {
            await onSubmit(values);
            onClose();
          }}
        />
      </div>
    </div>
  );
}