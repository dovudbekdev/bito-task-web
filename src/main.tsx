import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';

const MOCK_STORAGE_KEYS = ['bito-mock-store', 'bito-mock-session'];

for (const key of MOCK_STORAGE_KEYS) {
  localStorage.removeItem(key);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
