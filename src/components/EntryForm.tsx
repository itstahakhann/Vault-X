import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Wand2 } from 'lucide-react';
import { CATEGORIES, type Category, type VaultEntry } from '../types/vault';
import { isValidUrl, normalizeUrl } from '../utils/validation';
import PasswordGenerator from './PasswordGenerator';

export interface EntryFormValues {
  title: string;
  website: string;
  username: string;
  password: string;
  notes: string;
  category: Category;
  favorite: boolean;
}

interface Props {
  initial?: Partial<VaultEntry>;
  submitLabel: string;
  onSubmit: (values: EntryFormValues) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

function emptyValues(): EntryFormValues {
  return {
    title: '',
    website: '',
    username: '',
    password: '',
    notes: '',
    category: 'Personal',
    favorite: false,
  };
}

export default function EntryForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [values, setValues] = useState<EntryFormValues>(() => {
    const base = emptyValues();
    return {
      ...base,
      ...initial,
      category: (initial?.category as Category) ?? base.category,
    };
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reset when the initial entry changes (e.g. switching modals).
    if (initial) {
      setValues((v) => ({ ...v, ...initial, category: (initial.category as Category) ?? v.category }));
    }
  }, [initial]);

  const set = <K extends keyof EntryFormValues>(key: K, val: EntryFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const urlError = useMemo(
    () => (values.website && !isValidUrl(values.website) ? 'Enter a valid URL' : null),
    [values.website]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.title.trim()) {
      setError('Name is required');
      return;
    }
    if (!values.password) {
      setError('Password is required');
      return;
    }
    if (urlError) {
      setError(urlError);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        title: values.title.trim(),
        website: normalizeUrl(values.website),
        username: values.username.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ef-title" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Name <span className="text-danger">*</span>
        </label>
        <input
          id="ef-title"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="GitHub"
          required
          className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <label htmlFor="ef-website" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Website
        </label>
        <input
          id="ef-website"
          value={values.website}
          onChange={(e) => set('website', e.target.value)}
          placeholder="https://github.com"
          className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {urlError && <p className="mt-1 text-xs text-danger">{urlError}</p>}
      </div>

      <div>
        <label htmlFor="ef-username" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Username / Email
        </label>
        <input
          id="ef-username"
          value={values.username}
          onChange={(e) => set('username', e.target.value)}
          placeholder="taha@example.com"
          autoComplete="off"
          className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div>
        <label htmlFor="ef-password" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Password <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            id="ef-password"
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 pr-10 text-sm font-mono text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowGenerator((v) => !v)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover focus:outline-none focus:ring-2 focus:ring-accent rounded"
        >
          <Wand2 size={12} />
          {showGenerator ? 'Hide generator' : 'Generate password'}
        </button>
        {showGenerator && (
          <div className="mt-3 rounded-md border border-border-subtle bg-bg-base p-3">
            <PasswordGenerator
              compact
              onUse={(pw) => {
                set('password', pw);
                setShowGenerator(false);
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="ef-notes" className="mb-1.5 block text-sm font-medium text-text-secondary">
          Notes
        </label>
        <textarea
          id="ef-notes"
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          placeholder="Optional notes"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ef-category" className="mb-1.5 block text-sm font-medium text-text-secondary">
            Category
          </label>
          <select
            id="ef-category"
            value={values.category}
            onChange={(e) => set('category', e.target.value as Category)}
            className="w-full rounded-md border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={values.favorite}
            onChange={(e) => set('favorite', e.target.checked)}
            className="accent-accent"
          />
          Favorite
        </label>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-border-subtle px-3 py-2 text-sm text-danger hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}