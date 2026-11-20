// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { UnicaProvider, type ThemeConfig } from '../src/index.js';
import { IconSizeProbe } from './fixtures/icon-size-probe.js';

it('renders isolated requests with or without a provider when the DOM is absent', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');

  const theme: ThemeConfig = { preset: 'soft-light', defaults: { Icon: { size: 'l' } } };
  const themed = renderToString(
    <UnicaProvider theme={theme}>
      <section data-theme={theme.preset}>
        <IconSizeProbe label="Themed" />
      </section>
    </UnicaProvider>,
  );
  expect(themed).toBe(
    '<section data-theme="soft-light"><button type="button" data-size="l" style="width:var(--size-l-icon)">Themed</button></section>',
  );

  const plain = renderToString(<IconSizeProbe label="Default" />);
  expect(plain).toBe(
    '<button type="button" data-size="inherit" style="width:1em">Default</button>',
  );

  const independent = renderToString(
    <UnicaProvider overrides={{ Icon: { size: 's' } }}>
      <IconSizeProbe label="Independent" />
    </UnicaProvider>,
  );
  expect(independent).toBe(
    '<button type="button" data-size="s" style="width:var(--size-s-icon)">Independent</button>',
  );
});
