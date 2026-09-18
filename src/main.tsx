import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * SECURITY: We intentionally do not attach any global error handlers that
 * would serialize vault state, keys, or passwords. Errors bubble up
 * normally and are handled locally where safe.
 */

if (!('crypto' in window) || !crypto.subtle) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-lg font-semibold text-text-primary">Unsupported Browser</h1>
        <p className="mt-2 text-sm text-text-secondary">
          VaultX requires the Web Crypto API, which your browser does not appear to
          support. Please use a modern browser over a secure (HTTPS or localhost) context.
        </p>
      </div>
    </div>
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}