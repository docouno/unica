import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { assertFocused, getBox, resetForm, submitForm } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const entries = (form) => form.evaluate((owner) => [...new FormData(owner)]);
const described = (control) =>
  control.evaluate((node) =>
    (node.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((id) => node.getRootNode().getElementById(id)?.textContent),
  );
const marks = (field) => field.locator('svg:visible').count();

async function accessibleDescription(page, control) {
  const session = await page.context().newCDPSession(page);
  try {
    const selector = await control.evaluate((node) => `#${CSS.escape(node.id)}`);
    const { root } = await session.send('DOM.getDocument');
    const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const { nodes } = await session.send('Accessibility.getPartialAXTree', { nodeId });
    return nodes[0]?.description?.value;
  } finally {
    await session.detach();
  }
}

export default {
  'FormField connects server labels before hydration and keeps native form authority': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('form-field-ssr');
    await mount('form-field-hydration');
    await page.getByTestId('server-markup').evaluate((host, markup) => {
      host.innerHTML = markup;
      window.originalEditors = [...host.querySelectorAll('input,textarea')];
    }, html);
    const form = page.getByTestId('server-form');
    const [local, controlled] = await form
      .getByRole('textbox', { name: 'Project', exact: true })
      .all();
    const labels = form.locator('label').filter({ hasText: 'Project' });
    assert.deepEqual(
      await labels.evaluateAll((nodes) => nodes.map((node) => node.control?.tagName)),
      ['INPUT', 'TEXTAREA'],
    );
    assert.notEqual(
      await labels.nth(0).getAttribute('for'),
      await labels.nth(1).getAttribute('for'),
    );
    assert.deepEqual(await described(local), [
      'Author hint.',
      'Used in the title.',
      'Check the name.',
      '0',
    ]);
    assert.equal(
      await accessibleDescription(page, local),
      'Author hint. Used in the title. Check the name. 0',
    );
    assert.equal(await local.getAttribute('aria-invalid'), 'true');
    const outer = page.getByTestId('outer-glyph');
    const nested = page.getByTestId('nested-glyph');
    const concealed = page.getByTestId('hidden-glyph');
    const styled = page.getByTestId('style-hidden-glyph');
    assert.equal(await marks(outer), 2);
    assert.equal(await marks(nested), 1);
    assert.equal(await marks(concealed), 1);
    assert.equal(await marks(styled), 1);
    await labels.nth(0).click();
    await assertFocused(local);
    await local.fill('Draft before hydration');
    await button(page, 'Hydrate fields').click();
    await form.and(page.locator('[data-hydrated][data-ref-matches]')).waitFor();
    assert.equal(
      await form.evaluate((node) =>
        Array.from(node.querySelectorAll('input,textarea')).every(
          (editor, index) => editor === window.originalEditors[index],
        ),
      ),
      true,
    );
    assert.deepEqual(await entries(form), [
      ['project', 'Draft before hydration'],
      ['note', 'Owner text'],
    ]);
    const outerMessage = outer.getByText('Outer advisory.').locator('..');
    const retainedMessage = concealed.getByText('Retained advisory.').locator('..');
    assert.equal(await marks(outer), 2);
    assert.equal(await marks(outerMessage), 0);
    assert.equal(await marks(nested), 1);
    assert.equal(await marks(retainedMessage), 1);
    await button(page, 'Reveal editor').click();
    await retainedMessage.locator('svg:visible').waitFor({ state: 'hidden' });
    assert.equal(await marks(concealed), 1);
    const styledMessage = styled.getByText('Styled advisory.').locator('..');
    assert.equal(await marks(styledMessage), 1);
    await button(page, 'Toggle editor visibility').click();
    await styledMessage.locator('svg:visible').waitFor({ state: 'hidden' });
    assert.equal(await marks(styled), 1);
    await button(page, 'Toggle editor visibility').click();
    await styledMessage.locator('svg:visible').waitFor();
    assert.equal(await marks(styled), 1);
    await button(page, 'Accept edits').focus();
    await page.keyboard.press('Shift+Tab');
    await assertFocused(local);
    await page.keyboard.press('Tab');
    await assertFocused(button(page, 'Accept edits'));
    await page.keyboard.press('Tab');
    await assertFocused(controlled);
    await controlled.fill('Rejected proposal');
    assert.equal(await controlled.inputValue(), 'Owner text');
    await button(page, 'Accept edits').click();
    await controlled.fill('Accepted proposal');
    await local.fill('Edited locally');
    assert.deepEqual(await entries(form), [
      ['project', 'Edited locally'],
      ['note', 'Accepted proposal'],
    ]);
    await form.evaluate((owner) => {
      owner.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      owner.reset();
    });
    assert.equal(await local.inputValue(), 'Edited locally');
    const edits = await page.getByTestId('edit-count').textContent();
    await resetForm(form);
    assert.deepEqual(await entries(form), [
      ['project', 'Initial title'],
      ['note', 'Accepted proposal'],
    ]);
    assert.equal(await page.getByTestId('edit-count').textContent(), edits);
  },

  'FormField retains external errors and updates native fieldset availability and glyph ownership':
    async ({ page, mount }) => {
      await mount('form-field');
      const local = page.getByRole('textbox', { name: 'Local draft' });
      const localField = page.getByTestId('local-field');
      const message = localField.getByText('Draft needs attention.');
      assert.equal(await message.isVisible(), true);
      assert.equal(await marks(localField), 1);
      assert.equal(await local.getAttribute('aria-invalid'), null);
      assert.deepEqual(await described(local), ['Outside hint.', 'Help stays.', '0']);
      const id = await local.getAttribute('id');
      await button(page, 'Toggle local disabled').click();
      assert.equal(await local.getAttribute('aria-invalid'), 'true');
      assert.deepEqual(await described(local), [
        'Outside hint.',
        'Draft needs attention.',
        'Help stays.',
        '0',
      ]);
      assert.equal(await marks(localField), 1);
      await button(page, 'Toggle field disabled').click();
      assert.equal(await message.count(), 0);
      assert.equal(await local.getAttribute('id'), id);
      assert.equal(await local.isEnabled(), true);
      assert.equal(await local.getAttribute('aria-invalid'), null);

      const inside = page.getByRole('textbox', { name: 'Inner notes' });
      const covered = page.getByTestId('inherited-field');
      const exempt = page.getByRole('textbox', { name: 'Legend editor' });
      const radio = page.getByRole('radiogroup', { name: 'Review type' });
      const cards = page.getByRole('radiogroup', { name: 'Review policy' });
      const guide = cards.getByRole('link', { name: 'Read the review guide' });
      assert.deepEqual(await described(inside), ['Editing hint.', 'Review these notes.']);
      assert.equal(await marks(covered), 1);
      assert.equal(await radio.getAttribute('aria-invalid'), 'true');
      await button(page, 'Toggle wrapping').click();
      assert.equal(await inside.getAttribute('wrap'), 'off');
      assert.equal(await marks(covered), 1);
      assert.equal(
        await covered.getByText('Review these notes.').locator('..').locator('svg:visible').count(),
        1,
      );
      await button(page, 'Toggle wrapping').click();
      assert.equal(await inside.getAttribute('wrap'), 'soft');

      await button(page, 'Toggle fieldset disabled').click();
      await radio.and(page.locator('[aria-disabled=true]')).waitFor();
      assert.equal(await inside.isDisabled(), true);
      assert.deepEqual(await described(inside), ['Editing hint.']);
      assert.equal(await covered.getByText('Review these notes.').isVisible(), true);
      assert.equal(await marks(covered), 1);
      assert.equal(await exempt.isEnabled(), true);
      assert.equal(await exempt.getAttribute('aria-invalid'), 'true');
      assert.equal(await radio.getAttribute('aria-invalid'), null);
      assert.deepEqual(await described(radio), []);
      assert.equal(await cards.getAttribute('aria-invalid'), null);
      assert.equal(await cards.getAttribute('aria-disabled'), null);
      assert.equal(await cards.getByRole('radio', { name: 'Audit changes' }).isDisabled(), true);
      await guide.focus();
      await assertFocused(guide);

      await page
        .getByTestId('fieldset')
        .evaluate((node) => node.prepend(document.createElement('legend')));
      await page.waitForFunction(
        () => !document.querySelector('legend input')?.hasAttribute('aria-invalid'),
      );
      assert.equal(await exempt.isDisabled(), true);
      await page.getByTestId('fieldset').evaluate((node) => node.firstElementChild.remove());
      await page.waitForFunction(() =>
        document.querySelector('legend input')?.hasAttribute('aria-invalid'),
      );
      assert.equal(await exempt.isEnabled(), true);
      await button(page, 'Toggle fieldset disabled').click();
      await radio.and(page.locator('[aria-invalid=true]')).waitFor();
      assert.deepEqual(await described(inside), ['Editing hint.', 'Review these notes.']);
    },

  'FormField labels groups without activating options and preserves native group and range behavior':
    async ({ page, mount }) => {
      await mount('form-field');
      const delivery = page.getByRole('group', { name: 'Delivery methods' });
      const email = delivery.getByRole('checkbox', { name: 'Email' });
      const app = delivery.getByRole('checkbox', { name: 'In-app' });
      const form = page.getByTestId('delivery');
      await page.getByText('Delivery methods', { exact: false }).first().click();
      assert.equal(await email.isChecked(), false);
      assert.equal(await app.isChecked(), false);
      assert.equal(await email.getAttribute('required'), null);
      assert.equal(await app.getAttribute('required'), null);
      await button(page, 'Save delivery settings').click();
      await assertFocused(email);
      await app.check();
      assert.deepEqual(await submitForm(form, button(page, 'Save delivery settings')), [
        ['delivery', 'app'],
      ]);
      await button(page, 'Reset delivery settings').click();
      assert.deepEqual(await entries(form), []);
      assert.equal(await app.isChecked(), false);

      const checkbox = page.getByRole('checkbox', { name: 'Active', exact: true });
      await page.locator('label[for="active-switch"]').click();
      assert.equal(await checkbox.isChecked(), true);
      await page.getByText('Zoom level', { exact: true }).click();
      await assertFocused(page.getByRole('slider', { name: 'Zoom level' }));
      const range = page.getByRole('group', { name: 'Budget range' });
      assert.deepEqual(await described(range), [
        'Outside hint.',
        'This budget exceeds the allocation.',
        'Adjust both bounds.',
      ]);
      assert.deepEqual(await described(range.getByRole('slider', { name: 'Low budget' })), [
        'Outside hint.',
        'Adjust both bounds.',
      ]);
      assert.ok(await range.getByRole('slider', { name: 'High budget' }).isVisible());

      const composite = page.getByRole('group', { name: 'Review window' });
      const start = composite.getByLabel('Start');
      const end = composite.getByLabel('End');
      assert.equal(await composite.getAttribute('aria-invalid'), null);
      assert.deepEqual(await described(composite), ['Use local time.']);
      assert.equal(await start.getAttribute('aria-invalid'), null);
      assert.deepEqual(await described(start), []);
      assert.equal(await end.getAttribute('aria-invalid'), 'true');
      assert.deepEqual(await described(end), ['Choose a later end time.']);
      await button(page, 'Toggle group error').click();
      assert.equal(await composite.getAttribute('aria-invalid'), 'true');
      assert.deepEqual(await described(composite), [
        'Use local time.',
        'This range overlaps another review.',
      ]);
      assert.equal(await end.getAttribute('aria-invalid'), null);
      assert.deepEqual(await described(end), []);
    },

  'FormField updates Slider and RangeSlider after native DOM moves and first connection': async ({
    page,
    mount,
  }) => {
    await mount('form-field');
    const field = page.getByTestId('range-field');
    const range = field.getByRole('group', { name: 'Budget range' });
    const thumb = range.getByRole('slider', { name: 'Low budget' });
    await button(page, 'Toggle fieldset disabled').click();
    await field.evaluate((node) => {
      node.ownerDocument.querySelector('[data-testid="fieldset-destination"]').append(node);
    });
    await range.and(page.locator('[aria-invalid=true]')).waitFor({ state: 'detached' });
    assert.equal(await thumb.isDisabled(), true);
    assert.deepEqual(await described(range), ['Outside hint.', 'Adjust both bounds.']);
    assert.deepEqual(await described(thumb), ['Outside hint.', 'Adjust both bounds.']);
    await field.evaluate((node) => {
      node.ownerDocument.querySelector('[data-testid="legend-destination"]').append(node);
    });
    await range.and(page.locator('[aria-invalid=true]')).waitFor();
    assert.equal(await thumb.isEnabled(), true);
    assert.deepEqual(await described(range), [
      'Outside hint.',
      'This budget exceeds the allocation.',
      'Adjust both bounds.',
    ]);

    await button(page, 'Connect detached slider').click();
    const first = page.getByRole('slider', { name: 'Detached slider' });
    await first.waitFor();
    assert.equal(
      await page.locator('[data-initial-invalid]').getAttribute('data-initial-invalid'),
      'true',
    );
    assert.equal(await first.isDisabled(), true);
    await first.and(page.locator('[aria-invalid=true]')).waitFor({ state: 'detached' });
    assert.deepEqual(await described(first), []);
    await button(page, 'Toggle fieldset disabled').click();
    await first.and(page.locator('[aria-invalid=true]')).waitFor();
    assert.deepEqual(await described(first), ['Choose a lower value.']);
    const shadowHost = page.getByTestId('shadow-destination');
    await shadowHost.evaluate((host) => {
      const fieldset = host.ownerDocument.createElement('fieldset');
      fieldset.disabled = true;
      host.attachShadow({ mode: 'open' }).append(fieldset);
    });
    await button(page, 'Connect shadow slider').click();
    const shadow = shadowHost.getByRole('slider', { name: 'Shadow slider' });
    await shadow.waitFor();
    assert.equal(
      await shadowHost.locator('[data-initial-invalid]').getAttribute('data-initial-invalid'),
      'true',
    );
    assert.equal(await shadow.isDisabled(), true);
    await shadow.and(page.locator('[aria-invalid=true]')).waitFor({ state: 'detached' });
    assert.deepEqual(await described(shadow), []);
    await shadowHost.evaluate((host) => {
      host.shadowRoot.querySelector('fieldset').disabled = false;
    });
    await shadow.and(page.locator('[aria-invalid=true]')).waitFor();
    assert.equal(await shadow.isEnabled(), true);
    assert.deepEqual(await described(shadow), ['Choose a lower value.']);
  },

  'FormField updates a detached Checkbox on first connection to a shadow fieldset': async ({
    page,
    mount,
  }) => {
    await mount('form-field');
    const shadowHost = page.getByTestId('shadow-destination');
    await shadowHost.evaluate((host) => {
      const fieldset = host.ownerDocument.createElement('fieldset');
      fieldset.disabled = true;
      host.attachShadow({ mode: 'open' }).append(fieldset);
    });
    await button(page, 'Connect shadow checkbox').click();
    const checkbox = shadowHost.getByRole('checkbox', { name: 'Shadow checkbox' });
    await checkbox.waitFor();
    assert.equal(
      await shadowHost.locator('[data-initial-invalid]').getAttribute('data-initial-invalid'),
      'true',
    );
    assert.equal(await checkbox.isDisabled(), true);
    await checkbox.and(page.locator('[aria-invalid=true]')).waitFor({ state: 'detached' });
    assert.deepEqual(await described(checkbox), []);
    await shadowHost.evaluate((host) => {
      host.shadowRoot.querySelector('fieldset').disabled = false;
    });
    await checkbox.and(page.locator('[aria-invalid=true]')).waitFor();
    assert.deepEqual(await described(checkbox), ['Accept to continue.']);
    await shadowHost.getByText('Shadow checkbox', { exact: true }).click();
    await checkbox.and(page.locator(':checked')).waitFor({ state: 'attached' });
  },

  'FormField responds to available width and keeps RTL support readable in forced colors': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await mount('form-field', {
      theme: 'frost-dark',
      surface: 'overlay',
      direction: 'rtl',
      textScale: 120,
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    const panel = page.getByTestId('layout-panel');
    const label = panel.locator('label');
    const input = panel.getByRole('textbox');
    const support = panel.getByText('Use the short shared workspace code.');
    const counter = panel.getByText('12 / 126 characters');
    const wideLabel = await getBox(label);
    const wideInput = await getBox(panel.locator('.form-field-layout-editor'));
    const wideSupport = await getBox(support);
    assert.ok(wideLabel.x > wideInput.x);
    assert.ok(Math.abs(wideInput.x + wideInput.width - (wideSupport.x + wideSupport.width)) < 2);
    assert.ok(wideSupport.y > wideInput.y);
    await button(page, 'Resize panel').click();
    const narrowLabel = await getBox(label);
    const narrowInput = await getBox(input);
    const narrowCounter = await getBox(counter);
    assert.ok(narrowLabel.y + narrowLabel.height <= narrowInput.y);
    assert.ok(narrowCounter.y > narrowInput.y);
    assert.equal(await panel.evaluate((node) => node.scrollWidth <= node.clientWidth + 1), true);
    assert.equal(await input.evaluate((node) => getComputedStyle(node).direction), 'ltr');
    assert.equal(await input.getAttribute('aria-invalid'), 'true');
    assert.equal(await marks(panel), 1);
    await label.click();
    await assertFocused(input);
  },

  'Migrated picker labels target the date editor, attachment button and read-only inspector':
    async ({ page, mount }) => {
      await mount('input-consumers');
      const date = page.getByTestId('date-picker');
      await date.locator('label').click();
      await assertFocused(date.getByRole('textbox', { name: 'Review date' }));
      const range = page.getByTestId('range-picker');
      await range.locator('label').click();
      await assertFocused(range.getByRole('textbox', { name: 'Review range' }));
      assert.equal(await range.getByRole('textbox').count(), 1);
      const files = page.getByTestId('file-editable');
      await files.getByRole('button', { name: 'Choose file · Attachment for case 42' }).waitFor();
      assert.equal(
        await files.locator('label').evaluate((label) => label.control?.tagName),
        'BUTTON',
      );
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        files.locator('label').click(),
      ]);
      await chooser.setFiles({
        name: 'brief.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Brief'),
      });
      assert.equal(await files.getByText('brief.txt').isVisible(), true);
      const inspector = page.getByTestId('file-readonly');
      assert.equal(await inspector.locator('label').count(), 0);
      const group = inspector.getByRole('group', { name: 'Approved attachment' });
      assert.ok((await described(group)).includes('A saved reference.'));
      await inspector.getByText('Approved attachment').click();
      assert.equal(await group.evaluate((node) => node === document.activeElement), false);
      await page.keyboard.press('Tab');
      await assertFocused(group);
    },

  'Migrated picker keeps Select trigger and search distinct on mouse and touch': async ({
    page,
    mount,
    origin,
    watchPage,
  }) => {
    await mount('input-consumers');
    await exerciseSelect(page);
    const touch = await page
      .context()
      .browser()
      .newContext({ hasTouch: true, isMobile: true, viewport: { width: 520, height: 1000 } });
    try {
      const touchPage = watchPage(await touch.newPage());
      touchPage.setDefaultTimeout(5000);
      await touchPage.goto(
        new URL('/test/browser/index.html?fixture=input-consumers&theme=soft-dark', origin).href,
      );
      await touchPage.locator('[data-browser-ready]').waitFor({ state: 'attached' });
      assert.equal(await touchPage.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
      await exerciseSelect(touchPage, true);
    } finally {
      await touch.close();
    }
  },

  'FormField Workbench exposes the shipped contract across its four tabs and copies JSX': async ({
    page,
    mount,
  }) => {
    await mount('input-workbench');
    const open = (tab, extra = {}) =>
      page.evaluate(
        (params) => {
          const url = new URL(window.location.href);
          url.search = new URLSearchParams(params).toString();
          history.pushState(null, '', url);
          window.dispatchEvent(new PopStateEvent('popstate'));
        },
        {
          fixture: 'input-workbench',
          item: 'form-field',
          tab,
          family: 'soft',
          scheme: 'dark',
          ...extra,
        },
      );
    await open('playground');
    await page
      .locator('.wb-artboard')
      .getByRole('textbox', { name: 'Workspace' })
      .fill('New workspace');
    await open('states', { mode: 'pairwise' });
    const matrix = page.getByRole('region', { name: 'Component matrix' });
    await matrix.and(page.locator('[data-wb-matrix-mode="pairwise"]')).waitFor();
    await matrix.locator('[data-wb-result-row]').first().waitFor({ timeout: 10000 });
    await open('compositions', { block: 'delivery-access' });
    await page
      .getByRole('group', { name: 'Send updates' })
      .getByRole('checkbox', { name: 'Email digest' })
      .check();
    await open('usage');
    const quickStart = page.locator('#wb-usage-quick-start');
    const snippet = quickStart.locator('pre');
    assert.match(await snippet.innerText(), /import.*FormField.*@docouno\/unica/u);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const copy = quickStart.getByRole('button', { name: 'Copy quick start snippet' });
    await copy.click();
    await copy.filter({ hasText: 'Copied' }).waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /<FormField[\s>]/u);
    await page.getByRole('heading', { name: 'Props & constraints' }).waitFor();
  },
};

async function exerciseSelect(page, tap = false) {
  const select = page.getByTestId('trigger-select');
  const trigger = select.getByRole('button', { name: /Primary choice/ });
  const triggerId = await trigger.getAttribute('id');
  assert.equal(await select.locator('label').getAttribute('for'), triggerId);
  assert.equal(await trigger.getAttribute('aria-invalid'), 'true');
  assert.deepEqual(await described(trigger), ['Select a value.', 'Choose a catalog entry.']);
  await trigger.locator('svg.unica-select-status:visible').waitFor();
  assert.equal(await select.locator('.unica-form-field-feedback-glyph:visible').count(), 0);
  if (tap) {
    await trigger.tap();
  } else {
    await select.locator('label').click();
  }
  const search = select.getByRole('textbox', { name: 'Search options' });
  await search.waitFor();
  assert.notEqual(await search.getAttribute('id'), triggerId);
  assert.deepEqual(await described(search), []);
  assert.equal(await search.getAttribute('aria-invalid'), null);
  assert.equal(await select.locator('label').evaluate((node) => node.control?.tagName), 'BUTTON');
  await search.fill('Research');
  assert.ok(await select.getByRole('option', { name: 'Research notes' }).isVisible());
  await search.press('Escape');
  await search.waitFor({ state: 'hidden' });
  await assertFocused(trigger);
}
