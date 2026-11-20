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

const { documentElement } = document;
documentElement.dataset.theme = preset;
documentElement.dataset.surface = params.get('surface') ?? 'base';
documentElement.dataset.textScale = params.get('textScale') ?? '100';
documentElement.dir = params.get('direction') ?? 'ltr';

const Fixture = await loadFixture();
const root = document.getElementById('root');
if (!root) {
  throw new Error('Browser fixture root is missing');
}
createRoot(root).render(
  <UnicaProvider theme={{ preset }}>
    <main data-browser-ready="">
      <Fixture />
    </main>
  </UnicaProvider>,
);
