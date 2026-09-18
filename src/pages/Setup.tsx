import { useMemo, useState } from 'react';
import { evaluateMasterPassword, MIN_MASTER_PASSWORD_LENGTH } from '../utils/validation';

interface Props {
  onCreate: (masterPassword: string) => Promise<void>;
}

export default function Setup({ onCreate }: Props) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => evaluateMasterPassword(pw), [pw]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < MIN_MASTER_PASSWORD_LENGTH) {
      setError(`Master password must be at least ${MIN_MASTER_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (pw !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await onCreate(pw);
      // Clear local state as soon as we're done with the plaintext.
      setPw('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create vault.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-10">
      <div className="w-full max-w-md">
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
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Your passwords. Your device. Your vault.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border-subtle bg-bg-surface p-5"
        >
          <div>
            <label htmlFor="setup-pw" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Create your master password
            </label>
            <input
              id="setup-pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              autoFocus
              className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {pw && (
              <div className="mt-2">
                <div className="h-1 w-full overflow-hidden rounded bg-bg-elevated">
                  <div
                    className={
                      'h-full transition-all ' +
                      (strength.score <= 1
                        ? 'bg-danger'
                        : strength.score === 2
                        ? 'bg-warning'
                        : 'bg-success')
                    }
                    style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-text-muted">{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="setup-confirm" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Confirm master password
            </label>
            <input
              id="setup-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2.5 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          >
            {busy ? 'Creating vault...' : 'Create Vault'}
          </button>

          <p className="text-xs leading-relaxed text-text-muted">
            Your master password cannot be recovered. If you forget it, your vault cannot
            be unlocked. We never store it.
          </p>
        </form>
      </div>
    </div>
  );
}