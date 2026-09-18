import { useMemo, useState } from 'react';
import { Lock, Plus, Settings as SettingsIcon, ShieldAlert, Star } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import VaultCard from '../components/VaultCard';
import EmptyVault from '../components/EmptyVault';
import AddEntryModal from '../components/AddEntryModal';
import EditEntryModal from '../components/EditEntryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SettingsPanel from '../components/SettingsPanel';
import type { Category, VaultEntry } from '../types/vault';
import { CATEGORIES } from '../types/vault';
import { analyzeVault } from '../utils/security';
import type { EntryFormValues } from '../components/EntryForm';

interface Props {
  entries: VaultEntry[];
  onAdd: (values: EntryFormValues) => Promise<void>;
  onUpdate: (id: string, patch: Partial<VaultEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLock: () => void;
  autoLockMinutes: number | null;
  onAutoLockChange: (m: number | null) => void;
  onExport: () => void;
  onRequestImport: () => void;
  onRequestClear: () => void;
}

type Filter = 'all' | 'favorites' | Category;

export default function Vault({
  entries,
  onAdd,
  onUpdate,
  onDelete,
  onLock,
  autoLockMinutes,
  onAutoLockChange,
  onExport,
  onRequestImport,
  onRequestClear,
}: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<VaultEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VaultEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter === 'favorites' && !e.favorite) return false;
      if (filter !== 'all' && filter !== 'favorites' && e.category !== filter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.website.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [entries, search, filter]);

  const security = useMemo(() => analyzeVault(entries), [entries]);

  const handleToggleFavorite = async (entry: VaultEntry) => {
    await onUpdate(entry.id, { favorite: !entry.favorite });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const activeFilterLabel =
    filter === 'all'
      ? 'All'
      : filter === 'favorites'
      ? 'Favorites'
      : filter;

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src="./icon.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-md"
            />
            <span className="text-sm font-semibold text-text-primary">VaultX</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSecurity((v) => !v)}
              aria-label="Toggle security overview"
              aria-pressed={showSecurity}
              className="rounded p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <ShieldAlert size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="rounded p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <SettingsIcon size={16} />
            </button>
            <button
              type="button"
              onClick={onLock}
              aria-label="Lock vault"
              className="rounded p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <Lock size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">My Vault</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {entries.length} {entries.length === 1 ? 'password' : 'passwords'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <Plus size={16} />
            Add Password
          </button>
        </div>

        {showSecurity && (
          <section
            aria-label="Vault security overview"
            className="mb-6 rounded-lg border border-border-subtle bg-bg-surface p-4"
          >
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Vault Security</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Strong passwords" value={security.strong} tone="success" />
              <Stat label="Weak passwords" value={security.weak} tone="danger" />
              <Stat label="Reused passwords" value={security.reused} tone="warning" />
              <Stat label="Old passwords" value={security.old} tone="warning" />
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Analysis runs entirely in memory. Nothing is uploaded.
            </p>
          </section>
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <FilterChip
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label="All"
            />
            <FilterChip
              active={filter === 'favorites'}
              onClick={() => setFilter('favorites')}
              label="Favorites"
              icon={<Star size={12} />}
            />
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c}
                active={filter === c}
                onClick={() => setFilter(c)}
                label={c}
              />
            ))}
          </div>
        </div>

        {entries.length === 0 ? (
          <EmptyVault onAdd={() => setAddOpen(true)} />
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-surface px-6 py-12 text-center">
            <p className="text-sm text-text-secondary">
              No entries match {search ? `"${search}"` : `the ${activeFilterLabel} filter`}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <VaultCard
                key={entry.id}
                entry={entry}
                onEdit={setEditing}
                onDelete={setDeleteTarget}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      <AddEntryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={onAdd}
      />

      <EditEntryModal
        open={!!editing}
        entry={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          if (editing) {
            await onUpdate(editing.id, values);
          }
        }}
        onDelete={() => {
          if (editing) {
            setDeleteTarget(editing);
            setEditing(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Password?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed from your local vault.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        autoLockMinutes={autoLockMinutes}
        onAutoLockChange={onAutoLockChange}
        onLockNow={() => {
          setSettingsOpen(false);
          onLock();
        }}
        onExport={() => {
          setSettingsOpen(false);
          onExport();
        }}
        onRequestImport={() => {
          setSettingsOpen(false);
          onRequestImport();
        }}
        onRequestClear={() => {
          setSettingsOpen(false);
          onRequestClear();
        }}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent ' +
        (active
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-border-subtle bg-bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary')
      }
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'danger';
}) {
  const color =
    tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-warning';
  return (
    <div className="rounded-md border border-border-subtle bg-bg-base p-3">
      <div className={'text-lg font-semibold ' + color}>{value}</div>
      <div className="mt-0.5 text-xs text-text-muted">{label}</div>
    </div>
  );
}