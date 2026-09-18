/**
 * Preload script.
 *
 * SECURITY: This file runs before the renderer's JS, in a context that
 * bridges the isolated world and the main world. It must expose the
 * absolute minimum API surface.
 *
 * VaultX needs NO Node APIs in the renderer, so this preload exposes
 * nothing. It exists only so the BrowserWindow config has a valid file
 * to load.
 */

'use strict';

// Intentionally empty. Do NOT expose ipcRenderer, fs, path, etc. here.