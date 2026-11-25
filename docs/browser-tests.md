# Browser Tests

```sh
make visual-setup
make test-browser
```

Run `make visual-setup` on a cold checkout, when the pinned environment changes, or when the browser cache needs repair. Preparation can use the network and shares its image and Chromium cache with `make visual`. Each `make test-browser` run loads the local dependencies and starts Chromium in the same container with external networking and image pulls disabled. Vite serves current UI source and CSS over container loopback. The run requires neither a Workbench server nor a build of `packages/ui`. Use `make test` for the regular Vitest suites.

Each scenario gets a fresh Playwright browser context. The runner reports scenario names and errors and returns a failing status to Make when a test fails.

## Add a scenario

Add a React default export under `apps/playground/test/browser/fixtures/`. Import shipped components from `@docouno/unica`. Fixtures that need private UI internals can live under `packages/ui/test/browser/` and be re-exported from the playground fixture directory.

Export a map of scenario names to async functions in a `*.browser.mjs` file under `apps/playground/test/browser/suites/`. For example, add `focus.browser.mjs` next to the other suites to use the existing `native` fixture.

```js
import { assertFocused, pressKeys } from '../helpers.mjs';

export default {
  'Tab reaches the first native button in RTL': async ({ page, mount }) => {
    await mount('native', { theme: 'frost-dark', surface: 'overlay', direction: 'rtl' });
    await pressKeys(page, 'Tab');
    await assertFocused(page.getByRole('button', { name: 'First stop' }));
  },
};
```

`mount` selects a fixture by filename and accepts a `theme` preset, `surface` (`base` or `overlay`), `textScale` (100 or 120), `direction` (`ltr` or `rtl`), and Playwright `forcedColors` and `reducedMotion` values. The defaults are Soft Dark, Base, 100%, LTR, and ordinary media modes. The environment applies to the whole fixture document, including portals mounted in `document.body`.

Scenarios that exercise a public workbench route receive the loopback `origin`. Open the route with `page.goto(new URL('/?item=select&tab=states', origin).href)`. A scenario can use the same origin in a separate touch-enabled browser context.

The helpers expose viewport hit-testing, bounding boxes with an optional tolerance, and native form submission and reset. `submitForm` captures ordered FormData entries on the native form's `submit` event and cancels navigation. Entries include repeated names, the clicked submitter, and file metadata. See the [native scenarios](../apps/playground/test/browser/suites/native.browser.mjs) for complete examples.

For a hydration scenario, `renderFixture(fixture)` renders the fixture component in Node. Insert that HTML into a dedicated browser container so the scenario can inspect the parsed DOM before hydrating it. See the [form authority suite](../apps/playground/test/browser/suites/form-authority.browser.mjs) for an example.
