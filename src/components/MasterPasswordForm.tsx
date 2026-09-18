import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  onSubmit: (password: string) => void | Promise<void>;
  submitLabel: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function MasterPasswordForm({
  onSubmit,
  submitLabel,
  disabled,
  autoFocus,
}: Props) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || disabled) return;
    await onSubmit(password);
    setPassword('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Master Password"
          autoComplete="current-password"
          autoFocus={autoFocus}
          aria-label="Master password"
          className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2.5 pr-10 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <button
        type="submit"
        disabled={disabled || !password}
        className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}