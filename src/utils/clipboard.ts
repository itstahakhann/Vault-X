/**
 * Clipboard helpers.
 *
 * SECURITY: We do not log clipboard content. Where the API supports it,
 * we schedule a best-effort clear of the clipboard after a short delay.
 */

const CLEAR_DELAY_MS = 30_000;
let clearTimer: number | null = null;

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

export function scheduleClipboardClear(expected: string): void {
  if (clearTimer !== null) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  clearTimer = window.setTimeout(async () => {
    try {
      if (navigator.clipboard?.readText) {
        const current = await navigator.clipboard.readText();
        if (current === expected && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText('');
        }
      }
    } catch {
      // Permission denied or API unavailable - ignore silently.
    }
  }, CLEAR_DELAY_MS);
}
