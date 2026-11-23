import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

async function openWorkbench(page, route) {
  const url = new URL('/', page.url());
  url.search = new URLSearchParams({ family: 'frost', scheme: 'dark', ...route }).toString();
  await page.goto(url.href, { waitUntil: 'commit' });
  await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 18000 });
}

const button = (page, name) => page.getByRole('button', { name, exact: true });

export default {
  'Textarea Workbench matches the draft modes, native form actions, and displayed JSX': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await mount('textarea');
    await openWorkbench(page, { item: 'textarea', tab: 'playground', bounds: '1' });
    const editor = page.getByRole('textbox', { name: 'Release summary' });
    const code = page.getByRole('region', { name: 'JSX' }).locator('pre');
    const controlled = page.getByRole('checkbox', { name: /^useValue\b/u });
    const local = page.getByRole('checkbox', { name: /^useDefaultValue\b/u });
    const draftInput = page.getByRole('textbox', { name: /^draft\b/u });
    await editor.waitFor();
    assert.equal(await editor.getAttribute('data-wb-subject'), '');
    assert.match(await code.innerText(), /defaultValue=/u);
    assert.equal(await controlled.isDisabled(), true);
    assert.match(
      await page
        .getByText('Use either value or defaultValue for one instance.')
        .first()
        .textContent(),
      /value or defaultValue/u,
    );

    await editor.fill('A replacement');
    await editor.evaluate((node) => {
      window.inspectorEditor = node;
    });
    await draftInput.fill('A new default');
    assert.equal(await editor.evaluate((node) => node === window.inspectorEditor), true);
    assert.equal(await editor.inputValue(), 'A replacement');
    await button(page, 'Submit').click();
    await page.getByRole('tab', { name: 'FormData' }).click();
    assert.match(await page.getByRole('tabpanel').textContent(), /summary.*"A replacement"/s);
    await button(page, 'Reset').click();
    assert.equal(await editor.inputValue(), 'Search now includes archived pages.');

    await page.getByRole('tab', { name: 'Controls' }).click();
    await local.uncheck();
    assert.equal(await editor.inputValue(), '');
    assert.doesNotMatch(await code.innerText(), /(?:defaultValue|\bvalue)=/u);
    await draftInput.fill('');
    await controlled.check();
    assert.equal(await local.isDisabled(), true);
    assert.equal(await editor.inputValue(), '');
    assert.match(await code.innerText(), /useState\((?:''|"")\)/u);
    assert.match(await code.innerText(), /\bvalue=\{value\}/u);
    assert.doesNotMatch(await code.innerText(), /defaultValue=/u);

    await editor.scrollIntoViewIfNeeded();
    const box = await getBox(editor);
    const x = box.x + box.width - 4;
    const y = box.y + box.height - 4;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 50, { steps: 5 });
    await page.mouse.up();
    const resized = (await getBox(editor)).height;
    assert.ok(resized > box.height + 30);
    await editor.evaluate((node) => {
      window.inspectorEditor = node;
    });
    await draftInput.fill('New controlled draft');
    assert.equal(await editor.inputValue(), 'New controlled draft');
    assert.equal(await editor.evaluate((node) => node === window.inspectorEditor), true);
    assert.equal((await getBox(editor)).height, resized);

    await editor.fill('Controlled replacement');
    await button(page, 'Reset').click();
    assert.equal(await editor.inputValue(), 'Controlled replacement');
    await page.getByRole('tab', { name: 'Events' }).click();
    assert.ok(await page.getByText(/Controlled replacement/u).count());
  },

  'Textarea Workbench measures real editors and keeps feedback in reading order at 120 percent RTL':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mount('textarea');
      await openWorkbench(page, {
        item: 'textarea',
        tab: 'states',
        block: 'overflow',
        surface: 'overlay',
        dir: 'rtl',
        scale: '120',
        vp: '360',
        bounds: '1',
      });
      const block = page.locator('[data-wb-block="overflow"]');
      const log = block.getByRole('textbox', { name: 'Preserved log lines' });
      assert.equal(await log.getAttribute('data-wb-subject'), '');
      assert.equal(await log.getAttribute('wrap'), 'off');
      assert.equal(await log.getAttribute('dir'), 'ltr');
      assert.equal(await log.locator('..').locator('svg').count(), 0);
      const describedBy = await log.getAttribute('aria-describedby');
      const feedback = block.locator('[id=' + JSON.stringify(describedBy) + ']');
      assert.equal(await feedback.locator('svg[aria-hidden="true"]').count(), 1);
      assert.match(await feedback.textContent(), /feedback stays below/i);
      const bounds = block.locator('[data-wb-bounds-label]').first();
      await bounds.waitFor();
      const { width, height } = await getBox(log);
      const zoom = await log.evaluate((node) => Number(node.currentCSSZoom) || 1);
      assert.match(
        await bounds.textContent(),
        new RegExp(`${Math.round(width / zoom)}\\s*×\\s*${Math.round(height / zoom)}`, 'u'),
      );
      const long = block.getByRole('textbox', { name: /^A longer label/u });
      assert.deepEqual(
        await long.evaluate((node) =>
          node
            .getAttribute('aria-describedby')
            .split(' ')
            .map((id) => id.split('-').at(-1)),
        ),
        ['description', 'message', 'counter'],
      );

      await openWorkbench(page, { item: 'textarea', tab: 'states', mode: 'pairwise', vp: '1280' });
      assert.equal(
        await page
          .getByRole('region', { name: 'Component matrix' })
          .getAttribute('data-wb-matrix-mode'),
        'pairwise',
      );
      const subjects = page
        .getByRole('region', { name: 'Component matrix' })
        .locator('[data-wb-subject]');
      assert.ok((await subjects.count()) > 1);
      assert.equal(await subjects.first().evaluate((node) => node.localName), 'textarea');
    },

  'Textarea Workbench announces at Check and leaves typed drafts available during saving': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount('textarea');
    await openWorkbench(page, { item: 'textarea', tab: 'states', block: 'live' });
    const block = page.locator('[data-wb-block="live"]');
    const draft = block.getByRole('textbox', { name: 'Soft limit · live draft' });
    const check = button(block, 'Check note');
    const announcement = block.getByRole('status');
    await draft.clear();
    assert.equal(await announcement.textContent(), '');
    await check.click();
    await assertFocused(check);
    assert.equal(await announcement.textContent(), 'Write a note before saving.');
    assert.equal(await draft.getAttribute('aria-invalid'), 'true');
    await draft.fill('A complete release note');
    assert.equal(await draft.getAttribute('aria-invalid'), null);
    assert.equal(await announcement.textContent(), 'Write a note before saving.');
    await check.click();
    assert.equal(await announcement.textContent(), 'The note is ready to share.');

    await draft.focus();
    await draft.evaluate((node) => node.setSelectionRange(2, 8));
    await block
      .getByRole('checkbox', { name: 'Show saving state' })
      .evaluate((node) => node.click());
    await assertFocused(draft);
    assert.deepEqual(
      await draft.evaluate((node) => [
        node.selectionStart,
        node.selectionEnd,
        node.readOnly,
        node.disabled,
        new FormData(node.form).get('note'),
      ]),
      [2, 8, false, false, 'A complete release note'],
    );
    await button(block, 'Reset draft').click();
    assert.match(await draft.inputValue(), /^A little context/u);
  },

  'Textarea consumers retain native editing and saved text in Folio overlays': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await mount('textarea');
    await openWorkbench(page, { item: '06-page-properties-drawer', vp: '1280' });
    const drawer = page.getByRole('dialog', { name: 'Document properties & review' });
    const scope = drawer.getByRole('textbox', { name: 'Verification scope' });
    await scope.fill('Check standby lag and publish a handoff.');
    await button(drawer, 'Save properties').click();
    await drawer.waitFor({ state: 'hidden' });
    await button(page, 'Properties').click();
    assert.equal(await scope.inputValue(), 'Check standby lag and publish a handoff.');

    await openWorkbench(page, {
      item: '07-invite-access-modal',
      family: 'pixel',
      scheme: 'light',
      vp: '360',
      dir: 'rtl',
      scale: '120',
    });
    const modal = page.getByRole('dialog', { name: 'Invite members to Platform Eng' });
    const welcome = modal.getByRole('textbox', { name: 'Welcome note' });
    await welcome.fill('Welcome to the project.');
    await assertFocused(welcome);
    assert.equal(await welcome.inputValue(), 'Welcome to the project.');
    assert.equal(
      await welcome.evaluate((node) => node.closest('[data-surface]')?.dataset.surface),
      'overlay',
    );
  },
};
