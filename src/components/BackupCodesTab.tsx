import { useMemo, useState } from 'react';
import { KeyRound, Plus } from 'lucide-react';
import type { BackupCodeSet } from '../types/vault';
import BackupCodeCard from './BackupCodeCard';
import AddBackupCodeSetModal from './AddBackupCodeSetModal';
import ConfirmDialog from './ConfirmDialog';
import SearchBar from './SearchBar';

interface Props {
  sets: BackupCodeSet[];
  onAdd: (set: Omit<BackupCodeSet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate: (id: string, patch: Partial<BackupCodeSet>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function BackupCodesTab({ sets, onAdd, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<BackupCodeSet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupCodeSet | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sets;
    return sets.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.service.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q)
    );
  }, [sets, search]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Backup Codes</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {sets.length} {sets.length === 1 ? 'set' : 'sets'} · encrypted on this device
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Plus size={16} />
          Add Backup Codes
        </button>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search backup codes..." />
      </div>

      {sets.length === 0 ? (
        <EmptyBackupCodes onAdd={() => setAddOpen(true)} />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle bg-bg-surface px-6 py-12 text-center">
          <p className="text-sm text-text-secondary">No sets match "{search}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <BackupCodeCard
              key={s.id}
              set={s}
              onEdit={setEditing}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AddBackupCodeSetModal
        open={addOpen || !!editing}
        initial={editing ?? undefined}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
        onSubmit={async (values) => {
          if (editing) {
            await onUpdate(editing.id, values);
          } else {
            await onAdd(values);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Backup Codes?"
        description={
          deleteTarget
            ? `"${deleteTarget.label}" (${deleteTarget.codes.length} codes) will be permanently removed from your vault.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function EmptyBackupCodes({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent">
        <KeyRound size={22} />
      </div>
      <h3 className="text-base font-semibold text-text-primary">No backup codes yet.</h3>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">
        Paste or upload existing 2FA backup codes. They're encrypted inside your vault
        and never leave this device.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <Plus size={16} />
        Add Backup Codes
      </button>
    </div>
  );
}