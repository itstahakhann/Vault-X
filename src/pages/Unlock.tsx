import { useState } from 'react';
import MasterPasswordForm from '../components/MasterPasswordForm';

interface Props {
  onUnlock: (password: string) => Promise<void>;
}

export default function Unlock({ onUnlock }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (password: string) => {
    setError(null);
    setBusy(true);
    try {
      await onUnlock(password);
    } catch {
      setError('Unable to unlock vault. Check your master password and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img
              src="./icon.png"
              alt="VaultX"
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">VaultX</h1>
          <p className="mt-3 text-sm text-text-secondary">Welcome back</p>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-surface p-5">
          <MasterPasswordForm
            onSubmit={handle}
            submitLabel={busy ? 'Unlocking...' : 'Unlock'}
            autoFocus
            disabled={busy}
          />
          {error && (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-text-muted">
            Forgot your password? Your master password cannot be recovered.
          </p>
        </div>
      </div>
    </div>
  );
}