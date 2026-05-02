import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  const fallback = document.createElement('main');
  fallback.className = 'error-page';
  fallback.innerHTML = '<section class="alert"><h1>Dashboard error</h1><p>Root element was not found.</p></section>';
  document.body.appendChild(fallback);
} else {
  createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
