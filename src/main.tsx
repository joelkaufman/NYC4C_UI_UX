import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/geist';
import './app/globals.css';
import { App } from './app/App';

// Start downloading the page the visitor landed on in parallel with the app shell.
const path = window.location.pathname;
if (path.startsWith('/requests/')) void import('@/pages/ProcessPage');
else if (path.startsWith('/admin')) void import('@/pages/AdminPage');
else void import('@/pages/RequestListPage');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
