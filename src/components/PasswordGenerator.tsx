import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import {
  DEFAULT_GENERATOR_OPTIONS,
  estimateEntropyBits,
  generatePassword,
  type GeneratorOptions,
} from '../crypto/passwordGenerator';
import { copyToClipboard } from '../utils/clipboard';

interface Props {
  onUse?: (password: string) => void;
  compact?: boolean;
}

export default function PasswordGenerator({ onUse, compact = false }: Props) {
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_GENERATOR_OPTIONS);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = useCallback(() => {
    try {
      setError(null);
      setPassword(generatePassword(options));
    } catch (e) {
      setPassword('');
      setError(e instanceof Error ? e.message : 'Unable to generate');
    }
  }, [options]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const entropy = useMemo(() => estimateEntropyBits(options), [options]);

  const toggle = (key: keyof Omit<GeneratorOptions, 'length'>) => {
    setOptions((o) => ({ ...o, [key]: !o[key] }));
  };

  const handleCopy = async () => {
    if (!password) return;
    await copyToClipboard(password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={compact ? '' : 'space-y-4'}>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Generated password
        </label>
        <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-base px-3 py-2">
          <code className="flex-1 font-mono text-sm text-text-primary break-all select-all">
            {password || '—'}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!password}
            aria-label="Copy password"
            className="rounded p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-40"
          >
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          </button>
          <button
            type="button"
            onClick={regenerate}
            aria-label="Regenerate"
            className="rounded p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="gen-length" className="text-sm font-medium text-text-secondary">
            Length
          </label>
          <span className="text-sm font-mono text-text-primary">{options.length}</span>
        </div>
        <input
          id="gen-length"
          type="range"
          min={8}
          max={64}
          value={options.length}
          onChange={(e) => setOptions((o) => ({ ...o, length: Number(e.target.value) }))}
          className="w-full accent-accent"
        />
        <div className="mt-1 text-xs text-text-muted">
          ~{entropy} bits of entropy
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['uppercase', 'Uppercase'],
            ['lowercase', 'Lowercase'],
            ['numbers', 'Numbers'],
            ['symbols', 'Symbols'],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer"
          >
            <input
              type="checkbox"
              checked={options[key]}
              onChange={() => toggle(key)}
              className="accent-accent"
            />
            {label}
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {onUse && (
        <button
          type="button"
          onClick={() => onUse(password)}
          disabled={!password}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        >
          Use Password
        </button>
      )}
    </div>
  );
}