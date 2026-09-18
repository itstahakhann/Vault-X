import { Lock } from 'lucide-react';
import MasterPasswordForm from './MasterPasswordForm';

interface Props {
  onUnlock: (password: string) => Promise<void>;
  error?: string | null;
}

export default function LockScreen({ onUnlock, error }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-bg-surface text-text-secondary">
            <Lock size={20} />
          </div>
          <h1 className="text-lg font-semibold text-text-primary">Vault Locked</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your vault was locked after a period of inactivity.
          </p>
        </div>
        <MasterPasswordForm
          onSubmit={onUnlock}
          submitLabel="Unlock"
          autoFocus
        />
        {error && (
          <p className="mt-3 text-center text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}