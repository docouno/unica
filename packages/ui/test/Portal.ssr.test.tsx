// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Portal, PortalProvider, usePortalContainer } from '../src/index.js';
import '../src/core/overlay/runtime.js';

function ContainerStatus() {
  return <output>{usePortalContainer() ? 'ready' : 'waiting'}</output>;
}

it('renders inline content and a waiting consumer in Node SSR', () => {
  expect(typeof window).toBe('undefined');
  const symbols = Object.getOwnPropertySymbols(globalThis);
  const html = renderToString(
    <PortalProvider container={null}>
      <Portal>Portaled</Portal>
      <Portal disabled>Inline</Portal>
      <ContainerStatus />
    </PortalProvider>,
  );
  expect(html).toBe('Inline<output>waiting</output>');
  expect(Object.getOwnPropertySymbols(globalThis)).toEqual(symbols);
});
