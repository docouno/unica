import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WorkbenchApp } from './workbench/WorkbenchApp.js';

const element = document.getElementById('root');
if (!element) {
  throw new Error('Missing application root.');
}

const { unicaWorkbench } = await import('./unica.workbench.js');

createRoot(element).render(
  <StrictMode>
    <WorkbenchApp config={unicaWorkbench} />
  </StrictMode>,
);
