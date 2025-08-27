import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RedesignedApp from './App-Redesigned';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RedesignedApp />
  </StrictMode>
);
