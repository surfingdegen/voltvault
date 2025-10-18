import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import Admin from './Admin.tsx';
import './index.css';

const rootElement = document.getElementById('root')!;
const root = ReactDOM.createRoot(rootElement);

// Simple routing based on URL path
const path = window.location.pathname;

if (path === '/admin') {
  root.render(
    <React.StrictMode>
      <Admin />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
