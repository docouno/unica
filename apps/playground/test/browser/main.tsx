import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { THEME_PRESETS, UnicaProvider } from '@docouno/unica';
import '@docouno/unica/styles.css';

const fixtures = import.meta.glob<ComponentType>('./fixtures/*.tsx', { import: 'default' });
const params = new URLSearchParams(window.location.search);
const fixture = params.get('fixture');
const loadFixture = fixtures[`./fixtures/${fixture}.tsx`];
if (!loadFixture) {
  throw new Error(`Unknown browser fixture: ${fixture}`);
}

const preset = THEME_PRESETS.find(({ id }) => id === params.get('theme'))?.id;
if (!preset) {
  throw new Error(`Unknown theme preset: ${params.get('theme')}`);
}

const Fixture = await loadFixture();

const root = document.getElementById('root');
if (!root) {
  throw new Error('Browser fixture root is missing');
}
createRoot(root).render(
  <UnicaProvider theme={{ preset }}>
    <main
      data-browser-ready=""
      data-theme={preset}
      data-surface={params.get('surface')}
      data-text-scale={params.get('textScale')}
      dir={params.get('direction') ?? undefined}
    >
      <Fixture />
    </main>
  </UnicaProvider>,
);
