import { Plus, ShieldCheck } from 'lucide-react';

interface Props {
  onAdd: () => void;
}

export default function EmptyVault({ onAdd }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent">
        <ShieldCheck size={22} />
      </div>
      <h3 className="text-base font-semibold text-text-primary">Your vault is empty.</h3>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">
        Add your first password to get started. Everything stays encrypted on this device.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <Plus size={16} />
        Add Password
      </button>
    </div>
  );
}