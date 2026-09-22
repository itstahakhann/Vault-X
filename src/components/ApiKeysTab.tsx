import { useMemo, useState } from 'react';
import { KeySquare, Plus } from 'lucide-react';
import type { ApiKeyEntry } from '../types/vault';
import ApiKeyCard from './ApiKeyCard';
import AddApiKeyModal from './AddApiKeyModal';
import ConfirmDialog from './ConfirmDialog';
import SearchBar from './SearchBar';

interface Props {
  keys: ApiKeyEntry[];
  onAdd: (key: Omit<ApiKeyEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate: (id: string, patch: Partial<ApiKeyEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ApiKeysTab({ keys, onAdd, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | ApiKeyEntry['environment']>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ApiKeyEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return keys.filter((k) => {
      if (envFilter !== 'all' && k.environment !== envFilter) return false;
      if (!q) return true;
      return (
        k.label.toLowerCase().includes(q) ||
        k.service.toLowerCase().includes(q) ||
        k.notes.toLowerCase().includes(q)
      );
    });
  }, [keys, search, envFilter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">API Keys</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {keys.length} {keys.length === 1 ? 'key' : 'keys'} · encrypted on this device
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Plus size={16} />
          Add API Key
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search API keys..." />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {(['all', 'dev', 'staging', 'prod', 'other'] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEnvFilter(e)}
              aria-pressed={envFilter === e}
              className={
                'shrink-0 rounded-full border px-3 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent ' +
                (envFilter === e
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border-subtle bg-bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary')
              }
            >
              {e === 'all' ? 'All' : e}
            </button>
          ))}
        </div>
      </div>

      {keys.length === 0 ? (
        <EmptyApiKeys onAdd={() => setAddOpen(true)} />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle bg-bg-surface px-6 py-12 text-center">
          <p className="text-sm text-text-secondary">No keys match the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((k) => (
            <ApiKeyCard
              key={k.id}
              entry={k}
              onEdit={setEditing}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AddApiKeyModal
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
        title="Delete API Key?"
        description={
          deleteTarget
            ? `"${deleteTarget.label}" will be permanently removed from your vault.`
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

function EmptyApiKeys({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent">
        <KeySquare size={22} />
      </div>
      <h3 className="text-base font-semibold text-text-primary">No API keys stored.</h3>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">
        Store API keys, tokens, and secrets alongside your passwords. Encrypted with the
        same AES-GCM key as the rest of your vault.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <Plus size={16} />
        Add API Key
      </button>
    </div>
  );
}