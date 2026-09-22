import { useCallback, useEffect, useRef, useState } from 'react';
import Setup from './pages/Setup';
import Unlock from './pages/Unlock';
import Vault from './pages/Vault';
import ConfirmDialog from './components/ConfirmDialog';
import { useVault } from './hooks/useVault';
import { useAutoLock } from './hooks/useAutoLock';
import { validateExport } from './storage/vaultStore';
import type { VaultExport, VaultRecord } from './types/vault';
import { unlockVault } from './crypto';

const AUTO_LOCK_KEY = 'vaultx:autoLockMinutes';

function readAutoLock(): number | null {
  try {
    const raw = localStorage.getItem(AUTO_LOCK_KEY);
    if (raw === null) return 5;
    if (raw === 'never') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 5;
  } catch {
    return 5;
  }
}

export default function App() {
  const vault = useVault();
  const [autoLockMinutes, setAutoLockMinutes] = useState<number | null>(() => readAutoLock());
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    vault.refreshFromStorage().catch(() => {
      // Storage failures are non-fatal; we fall back to uninitialized.
    });
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        AUTO_LOCK_KEY,
        autoLockMinutes === null ? 'never' : String(autoLockMinutes)
      );
    } catch {
      // Ignore storage failures.
    }
  }, [autoLockMinutes]);

  const lock = useCallback(() => {
    vault.lock();
    setUnlockError(null);
  }, [vault]);

  useAutoLock(vault.status === 'unlocked', autoLockMinutes, lock);

  const handleCreate = async (masterPassword: string) => {
    await vault.createVault(masterPassword);
  };

  const handleUnlock = async (masterPassword: string) => {
    setUnlockError(null);
    try {
      await vault.unlock(masterPassword);
    } catch {
      setUnlockError('Unable to unlock vault. Check your master password and try again.');
      throw new Error('unlock failed');
    }
  };

  const handleExport = () => {
    const record = vault.record;
    if (!record) return;
    const payload: VaultExport = {
      app: 'VaultX',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      record,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultx-backup-${new Date().toISOString().slice(0, 10)}.vaultx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const exportData = validateExport(parsed);

      const password = window.prompt(
        'Enter the master password for this backup to verify and import it:'
      );
      if (password === null) return;

      const { payload } = await unlockVault(
        password,
        exportData.record.salt,
        exportData.record.kdf as any,
        exportData.record.encrypted
      );

      if (vault.record) {
        const ok = window.confirm(
          'Importing will replace your current local vault. Continue?'
        );
        if (!ok) return;
      }

      const rec: VaultRecord = {
        ...exportData.record,
        updatedAt: new Date().toISOString(),
      };
      const { key } = await unlockVault(
        password,
        rec.salt,
        rec.kdf as any,
        rec.encrypted
      );
      await vault.replaceVault(rec, key, payload);
    } catch (err) {
      alert(
        err instanceof Error && err.message
          ? `Import failed: ${err.message}`
          : 'Import failed: invalid backup file.'
      );
    }
  };

  const handleClear = async () => {
    await vault.clearVault();
    setClearOpen(false);
  };

  if (vault.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base text-sm text-text-muted">
        Loading vault...
      </div>
    );
  }

  if (vault.status === 'uninitialized') {
    return <Setup onCreate={handleCreate} />;
  }

  if (vault.status === 'locked') {
    return <Unlock onUnlock={handleUnlock} />;
  }

  return (
    <>
      <Vault
  entries={vault.entries}
  onAdd={vault.addEntry}
  onUpdate={vault.updateEntry}
  onDelete={vault.deleteEntry}

  backupCodeSets={vault.backupCodeSets}
  onAddBackupCodeSet={vault.addBackupCodeSet}
  onUpdateBackupCodeSet={vault.updateBackupCodeSet}
  onDeleteBackupCodeSet={vault.deleteBackupCodeSet}

  apiKeys={vault.apiKeys}
  onAddApiKey={vault.addApiKey}
  onUpdateApiKey={vault.updateApiKey}
  onDeleteApiKey={vault.deleteApiKey}

  onLock={lock}
  autoLockMinutes={autoLockMinutes}
  onAutoLockChange={setAutoLockMinutes}
  onExport={handleExport}
  onRequestImport={() => fileInputRef.current?.click()}
  onRequestClear={() => setClearOpen(true)}
/>
      <input
        ref={fileInputRef}
        type="file"
        accept=".vaultx,.json,application/json"
        className="hidden"
        onChange={handleFileChosen}
        aria-hidden="true"
        tabIndex={-1}
      />
      <ConfirmDialog
        open={clearOpen}
        title="Delete Entire Vault?"
        description={
          'This will permanently remove all locally stored vault data.\n\n' +
          'Make sure you have an encrypted backup if you need one.'
        }
        confirmLabel="Delete Everything"
        destructive
        onConfirm={handleClear}
        onCancel={() => setClearOpen(false)}
      />
      {unlockError && (
        <div className="sr-only" aria-live="polite">
          {unlockError}
        </div>
      )}
    </>
  );
}