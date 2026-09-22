<div align="center">

<img src="docs/logo.png" alt="VaultX" width="320" />

### Your passwords. Your device. Your vault.

A local-first password manager for the web and desktop.

[![Build](https://github.com/itstahakhann/Vault-X/actions/workflows/build.yml/badge.svg)](https://github.com/itstahakhann/Vault-X/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-33-47848f?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/itstahakhann/Vault-X/releases)

</div>

---

## What is VaultX?

VaultX is a **local-first** password manager. Your vault is encrypted in your browser using the Web Crypto API before it ever touches disk, and it never leaves your device.

There is no backend. No accounts. No sync servers. No telemetry. The master password you type never leaves the process you typed it in.

The same codebase runs as:

- A **web app** (any modern browser)
- A **desktop app** (Windows `.exe` via Electron)

Both share identical cryptography, storage, and UI — the desktop build is a hardened Electron shell around the same web bundle.

---

## Features

| | |
|---|---|
| 🔐 **Master-password vault** | One password to unlock everything. Never stored, never transmitted. |
| 🔒 **AES-GCM authenticated encryption** | Confidentiality *and* tamper detection. Fresh IV per operation. |
| 🧮 **PBKDF2-SHA256 key derivation** | 250,000 iterations, per-vault random salt. |
| 💾 **Local IndexedDB storage** | Only the encrypted envelope is persisted. Nothing else. |
| 🎲 **Cryptographically secure password generator** | `crypto.getRandomValues()` with rejection sampling — no modulo bias. |
| 🔎 **Instant search** | Filters over title, website, username, and category in memory. |
| 📁 **Categories** | Personal, Work, School, Finance, Development, Social, Other. |
| ⭐ **Favorites** | One-click pinning with a dedicated quick filter. |
| 🛡️ **Security dashboard** | Detects weak, reused, and stale passwords — entirely offline. |
| 🗝️ **Backup codes** | Store 2FA backup codes encrypted. Paste or upload. Auto-hide on reveal. |
| 🔑 **API keys** | Dedicated compartment for API keys and secrets with masking, expiry tracking, and environment filters. |
| 📋 **Secure clipboard** | Copy buttons with best-effort 30-second auto-clear. |
| ⏱️ **Auto-lock** | Configurable inactivity timeout, default 5 minutes. Clears key and plaintext from memory. |
| 📦 **Encrypted export / import** | Portable `.vaultx` backups. Encrypted envelope only — never plaintext. |
| 🖥️ **Desktop build** | Native Windows app packaged with Electron and `electron-builder`. |
| ♿ **Accessible UI** | Keyboard navigation, visible focus states, ARIA labels, sufficient contrast. |
| 📱 **Responsive** | Desktop, laptop, tablet, mobile. |

---

## Architecture

```
       Master Password
              │
              ▼
   Key Derivation (PBKDF2-SHA256, 250,000 iterations, 16-byte random salt)
              │
              ▼
   Encryption Key (non-extractable AES-GCM 256, in memory only)
              │
              ▼
   AES-GCM Encryption (fresh 12-byte IV per operation)
              │
              ▼
   Encrypted Vault Envelope
   (contains: passwords + backup codes + API keys, all as one ciphertext)
              │
              ▼
       IndexedDB (browser)  ──or──  Chromium profile (desktop)
```

**The vault record that gets persisted looks like this:**

```json
{
  "id": "vault",
  "formatVersion": 1,
  "kdf": { "name": "PBKDF2", "hash": "SHA-256", "iterations": 250000 },
  "cipher": { "name": "AES-GCM", "length": 256 },
  "salt": "…base64…",
  "encrypted": {
    "ciphertext": "…base64…",
    "iv": "…base64…"
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**The decrypted payload (in memory only, while unlocked) looks like this:**

```json
{
  "version": 2,
  "entries":       [ /* passwords */ ],
  "backupCodeSets":[ /* 2FA backup codes */ ],
  "apiKeys":       [ /* API keys and secrets */ ]
}
```

Every cryptographic parameter is stored explicitly and versioned. Future migrations — raising PBKDF2 iterations, switching to Argon2, enabling encrypted cloud sync — can be introduced without breaking existing vaults.

### Payload migrations

The payload carries a `version` field. On unlock, `migratePayload()` in `src/types/vault.ts` upgrades older payloads to the current shape in memory:

- **v1 → v2:** adds empty `backupCodeSets` and `apiKeys` arrays. Existing passwords are untouched.
- The upgraded payload is re-encrypted with the same key on the next save.

If the vault was created on v1.0.0 and is unlocked by v1.1.0+, the migration is automatic and lossless.

---

## Privacy

VaultX is **local-first by design**:

- The vault is encrypted **before** it is written to storage.
- The encrypted vault is stored **on your device** — IndexedDB in the browser, or the app's Chromium profile folder on desktop.
- No vault contents, master password, or derived key are ever sent to a server.
- There is **no backend**, no analytics, no telemetry, no crash reporting.
- The master password is **never** written to IndexedDB, `localStorage`, cookies, session storage, or logs.
- The derived encryption key is held in memory only and cleared on lock, auto-lock, and app close.
- Backup codes and API keys are stored inside the **same encrypted payload** as passwords — no additional persistence layers, no additional keys.

The only network request the app makes is the initial load of the web bundle (in the web build). Once loaded, it works fully offline.

---

## Security Notes

VaultX uses **standard, well-reviewed cryptography via the browser's Web Crypto API**. It does not invent its own algorithms.

**What it does right:**

- AES-GCM 256-bit authenticated encryption
- PBKDF2-SHA256 key derivation with 250,000 iterations
- Cryptographically secure random salts, IVs, and passwords (`crypto.getRandomValues()`)
- Non-extractable `CryptoKey` — the derived key cannot be exported from the crypto subsystem
- Fresh random IV per encryption operation
- Versioned storage format for future migrations
- Import validation rejects malformed files before applying them
- Electron build runs with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`
- Zero IPC surface — the renderer has no access to Node APIs
- Backup codes and API keys are masked by default; reveal auto-hides after 15 seconds

**What it does not claim:**

- ❌ This is **not** "unhackable"
- ❌ This is **not** "military-grade"
- ❌ This has **not** undergone a professional security audit
- ❌ This is **not** a replacement for an audited password manager if you're protecting high-value credentials

VaultX is **educational and open-source software**. Read the code, audit it, run it locally. Don't trust it with anything you can't afford to lose.

---

## Getting Started

### Web

```bash
git clone https://github.com/itstahakhann/Vault-X.git
cd Vault-X
npm install
npm run dev
```

Open the printed `localhost` URL. On first launch you'll be asked to create a master password.

> **Important:** the Web Crypto API's `crypto.subtle` is only available in **secure contexts** — HTTPS or `localhost`. If you serve a production build over plain HTTP on a non-localhost origin, the app will refuse to start.

### Desktop (Windows)

Download a prebuilt binary from the [Releases page](https://github.com/itstahakhann/Vault-X/releases):

- `VaultX Setup x.y.z.exe` — installer (Start Menu + desktop shortcuts)
- `VaultX-x.y.z-portable.exe` — single executable, no installation

To build from source:

```bash
npm install
npm run electron:dev            # dev with hot-reload inside Electron
npm run electron:build          # produce installer + portable .exe
```

Build outputs land in `release/`.

The desktop app stores its vault in the app's Chromium profile folder (`%APPDATA%\VaultX\`). Vaults created in the web build and the desktop build are **separate** — use **Export Encrypted Vault** and **Import Encrypted Vault** to move between them.

---

## Usage

### First run

1. Open VaultX.
2. Create a master password. **It cannot be recovered — write it down somewhere safe.**
3. The vault is created and encrypted locally.

### The three compartments

The vault is organised into three tabs:

- **Passwords** — website and app credentials
- **Backup Codes** — 2FA backup codes, stored encrypted
- **API Keys** — API keys, tokens, and secrets

Each compartment has its own add button, search box, and (for API keys) environment filter.

### Adding a password

1. Go to the **Passwords** tab.
2. Click **Add Password**.
3. Fill in name, website, username, password, notes, category.
4. Use **Generate password** for a cryptographically secure one, or paste your own.
5. Click **Save Password**.

### Adding backup codes

1. Go to the **Backup Codes** tab.
2. Click **Add Backup Codes**.
3. Give it a label (e.g. "GitHub 2FA") and optional service name.
4. **Paste** codes into the textarea — one per line, comma-separated, or with enumerators like `1.`, `1)`, `- `. Duplicates and blank lines are ignored.
5. Or click **Upload file** to load a `.txt` or `.csv` file.
6. The preview shows how many codes were detected before you save.
7. Click **Add Codes**.

Codes are masked in the card view. Click **Reveal** to show them for 15 seconds. Click **Copy all** to copy the entire set — the clipboard clears after 30 seconds.

### Adding an API key

1. Go to the **API Keys** tab.
2. Click **Add API Key**.
3. Fill in:
   - **Label** (e.g. "Stripe Production")
   - **Key** — the secret itself
   - **Service** (e.g. "Stripe")
   - **Environment** (dev / staging / prod / other)
   - **Expiration date** — optional
   - **Notes**
4. Click **Add Key**.

Keys are masked by default with a recognizable prefix (e.g. `sk-••••••••`). Click **Reveal** to show for 15 seconds. Click **Copy** to copy the key — the clipboard clears after 30 seconds.

### Locking and unlocking

- **Auto-lock** defaults to 5 minutes of inactivity.
- **Lock Vault Now** is available in Settings and from the header.
- Refreshing the page or closing the app **always** requires the master password again. The vault is never auto-restored from storage.

### Backups

Use **Settings → Export Encrypted Vault** to download an encrypted `.vaultx` file. This file contains only the encrypted envelope — safe to store in cloud storage, a password manager of last resort, or a USB stick. **Restore it via Settings → Import Encrypted Vault.**

Never share your exported vault alongside your master password.

---

## Project Structure

```
vaultx/
├── electron/                    Electron main + preload (desktop shell)
│   ├── main.cjs
│   └── preload.cjs
├── public/                      Static assets served by Vite
│   ├── icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── apple-touch-icon.png
│   ├── favicon.ico
│   ├── manifest.webmanifest
│   └── logo.png
├── build/                       electron-builder resources
│   └── icon.ico
├── src/
│   ├── components/
│   │   ├── VaultCard.tsx
│   │   ├── PasswordGenerator.tsx
│   │   ├── SearchBar.tsx
│   │   ├── MasterPasswordForm.tsx
│   │   ├── LockScreen.tsx
│   │   ├── AddEntryModal.tsx
│   │   ├── EditEntryModal.tsx
│   │   ├── EntryForm.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyVault.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── BackupCodesTab.tsx
│   │   ├── BackupCodeCard.tsx
│   │   ├── AddBackupCodeSetModal.tsx
│   │   ├── ApiKeysTab.tsx
│   │   ├── ApiKeyCard.tsx
│   │   └── AddApiKeyModal.tsx
│   ├── pages/
│   │   ├── Setup.tsx
│   │   ├── Unlock.tsx
│   │   └── Vault.tsx
│   ├── crypto/
│   │   ├── encryption.ts        AES-GCM encrypt / decrypt
│   │   ├── keyDerivation.ts     PBKDF2 key derivation
│   │   ├── passwordGenerator.ts CSPRNG password generation
│   │   ├── random.ts            Secure randomness helpers
│   │   └── index.ts             Public crypto API
│   ├── storage/
│   │   └── vaultStore.ts        IndexedDB persistence
│   ├── hooks/
│   │   ├── useVault.ts          Vault session state + CRUD
│   │   └── useAutoLock.ts       Inactivity timer
│   ├── utils/
│   │   ├── backupCodes.ts       Backup code generation + parsing
│   │   ├── clipboard.ts         Copy + best-effort clear
│   │   ├── security.ts          Password strength analysis
│   │   └── validation.ts        Input validation
│   ├── types/
│   │   └── vault.ts             Data model + payload migrations
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig*.json
├── LICENSE
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Crypto | Web Crypto API (browser-native) |
| Storage | IndexedDB |
| Desktop shell | Electron 33 + electron-builder |
| Linting | ESLint |

No state-management library, no ORM, no backend, no third-party crypto. Each dependency above is deliberate.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (browser) |
| `npm run build` | Type-check and produce a production web build in `dist/` |
| `npm run preview` | Preview the production web build |
| `npm run lint` | Run ESLint |
| `npm run electron:dev` | Run Vite + Electron together with hot-reload |
| `npm run electron:build` | Build and package the Windows installer + portable `.exe` |
| `npm run electron:build:portable` | Build only the portable `.exe` |

---

## Changelog

### v1.1.0

- ✨ **Backup Codes** compartment — paste or upload 2FA backup codes, masked by default with auto-hide on reveal
- ✨ **API Keys** compartment — dedicated storage for API keys with label, service, environment, expiration, and notes
- ✨ Environment filter and expiry warnings on API keys
- ✨ Payload version 2 with automatic migration from v1
- 🔧 Modals now use fixed header/footer with a scrollable body on small screens

### v1.0.0

- Initial release: master-password vault, AES-GCM encryption, IndexedDB storage, CSPRNG password generator, search, categories, favorites, security dashboard, encrypted export/import, auto-lock, Electron desktop build.

---

## Roadmap

The storage and crypto layers are structured to support these without a rewrite:

- **Encrypted cloud sync** — the server would only ever see the encrypted envelope. Zero-knowledge by construction.
- **TOTP / authenticator secrets** — additional encrypted field per entry.
- **Secure notes** — encrypted notes independent of login credentials.
- **Browser extension** — same crypto, different shell, reading from the same encrypted store.
- **Additional KDFs** — Argon2id option for future vaults, with automatic migration.
- **Auto-update** — `electron-updater` wired to GitHub Releases.

None of these are implemented in the current version. The architecture is ready; the features are not.

---

## Contributing

Issues and pull requests are welcome. Before opening a PR:

1. Run `npm run build` and confirm it passes.
2. Run `npm run lint`.
3. For anything security-sensitive, describe the threat model in the PR description.

**Please do not open public issues for security vulnerabilities.** If you find a cryptographic or storage flaw, open a private security advisory instead.

---

## License

[MIT](LICENSE)

---

<div align="center">

**If VaultX is useful to you, consider starring the repo — it helps others find it.**

</div>