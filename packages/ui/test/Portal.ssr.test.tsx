// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Portal, UnicaProvider, usePortalContainer } from '../src/index.js';
import '../src/core/overlay/positioning.js';
import '../src/core/overlay/runtime.js';

function ContainerStatus() {
  return <output>{usePortalContainer() ? 'ready' : 'waiting'}</output>;
}

it('renders inline content and waiting consumers in Node SSR with and without a provider', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  const symbols = Object.getOwnPropertySymbols(globalThis);
  const bareHtml = renderToString(
    <>
      <Portal>Default portaled</Portal>
      <Portal disabled>Default inline</Portal>
      <ContainerStatus />
    </>,
  );
  expect(bareHtml).toBe('Default inline<output>waiting</output>');

  const waitingHtml = renderToString(
    <UnicaProvider portalContainer={null}>
      <Portal>Portaled</Portal>
      <Portal disabled>Inline</Portal>
      <ContainerStatus />
    </UnicaProvider>,
  );
  expect(waitingHtml).toBe('Inline<output>waiting</output>');
  expect(Object.getOwnPropertySymbols(globalThis)).toEqual(symbols);
});
