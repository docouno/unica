import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { unicaWorkbench } from './unica.workbench.js';
import { WorkbenchApp } from './workbench/WorkbenchApp.js';

const element = document.getElementById('root');
if (!element) {
  throw new Error('Missing application root.');
}

createRoot(element).render(
  <StrictMode>
    <WorkbenchApp config={unicaWorkbench} />
  </StrictMode>,
);
