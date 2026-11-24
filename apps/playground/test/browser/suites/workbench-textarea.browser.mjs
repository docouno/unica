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
      assert.match(await feedback.textContent(), /timestamps use UTC/iu);
      const editorBox = await getBox(log);
      const feedbackBox = await getBox(feedback);
      assert.ok(feedbackBox.y >= editorBox.y + editorBox.height - 1);
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
    assert.equal(await announcement.textContent(), '');
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
    await block.getByRole('checkbox', { name: 'Show saving state' }).uncheck();
    await button(block, 'Submit draft').click();
    const receipt = block.locator('p').filter({ hasText: /^Submitted draft:/u });
    assert.equal(await receipt.textContent(), 'Submitted draft: A complete release note');
    await button(block, 'Load long draft').click();
    assert.ok((await draft.inputValue()).length > 160);
    assert.equal(await announcement.textContent(), '');
    assert.equal(await receipt.textContent(), 'Submitted draft: A complete release note');
    await button(block, 'Reset draft').click();
    await receipt.waitFor({ state: 'detached' });
    assert.match(await draft.inputValue(), /^A little context/u);
    assert.equal(await receipt.count(), 0);
  },

  'Textarea review form rejects invalid notes and honors canceled resets': async ({
    page,
    mount,
  }) => {
    await mount('textarea');
    await openWorkbench(page, { item: 'textarea', tab: 'compositions', block: 'form' });
    const board = page.locator('[data-wb-block="form"] .wb-artboard');
    const note = board.getByRole('textbox', { name: 'Review note' });
    const submit = button(board, 'Submit draft');
    const reset = button(board, 'Reset draft');
    const receipt = board.locator('p').filter({ hasText: /^Submitted draft:/u });
    const opening = await note.inputValue();
    const valid = 'e\u0301'.repeat(160);
    await note.fill(valid);
    await submit.click();
    assert.equal(await receipt.textContent(), 'Submitted draft: ' + valid);
    for (const invalid of [valid + '👨‍👩‍👧', '   ']) {
      await note.fill(invalid);
      await submit.click();
      assert.equal(await note.getAttribute('aria-invalid'), 'true');
      assert.equal(await note.evaluate((field) => field.validity.valid), false);
      assert.equal(await note.inputValue(), invalid);
      assert.equal(await receipt.textContent(), 'Submitted draft: ' + valid);
      await assertFocused(note);
    }

    await note.evaluate((field) => {
      field.ownerDocument.addEventListener('reset', (event) => event.preventDefault(), {
        once: true,
      });
    });
    await reset.press('Enter');
    await page.evaluate(
      () => new Promise((done) => setTimeout(() => requestAnimationFrame(done), 0)),
    );
    assert.equal(await note.inputValue(), '   ');
    assert.equal(await receipt.textContent(), 'Submitted draft: ' + valid);
    assert.equal(await board.getByRole('status').textContent(), 'Write a note before saving.');
    await reset.press('Enter');
    await receipt.waitFor({ state: 'detached' });
    assert.equal(await note.inputValue(), opening);
    assert.equal(await receipt.count(), 0);
    assert.equal(await board.getByRole('status').textContent(), '');
  },

  'Textarea review form submits native edits immediately after reset': async ({ page, mount }) => {
    await mount('textarea');
    await openWorkbench(page, {
      item: 'textarea',
      tab: 'compositions',
      block: 'form',
      scheme: 'both',
    });
    const boards = page.locator('[data-wb-block="form"] .wb-artboard');
    const active = boards.first();
    const note = active.getByRole('textbox', { name: 'Review note' });
    const receipt = active.locator('p').filter({ hasText: /^Submitted draft:/u });
    const peer = boards.nth(1).getByRole('textbox', { name: 'Review note' });
    const peerId = await peer.getAttribute('id');
    const opening = await note.inputValue();
    await peer.fill('Independent draft');
    const status = active.getByRole('status');
    for (const draft of ['First revision', 'Second revision']) {
      await note.fill(draft);
      assert.equal(await status.textContent(), '');
      await button(active, 'Submit draft').press('Enter');
      assert.equal(await status.textContent(), 'Draft saved.');
    }
    const repeated = await status.evaluate(async (region) => {
      const messages = [];
      const observer = new MutationObserver(() => messages.push(region.textContent));
      observer.observe(region, { childList: true, subtree: true, characterData: true });
      const form = region.closest('form');
      form.reset();
      form.requestSubmit();
      await new Promise((done) => requestAnimationFrame(done));
      observer.disconnect();
      return messages;
    });
    assert.ok(repeated.includes('Draft saved.'));

    const previous = 'x'.repeat(161);
    for (const timing of ['same stack', 'microtask', 'new edit', 'canceled', 'reinserted']) {
      // Even a previously invalid draft must release its native constraint on reset.
      await note.fill(previous);
      const result = await note.evaluate(
        async (field, { timing, peerId }) => {
          const form = field.form;
          const submissions = [];
          const previous = field.value;
          const readSubmit = () => submissions.push([field.value, new FormData(form).get('note')]);
          form.addEventListener('submit', readSubmit);
          if (timing === 'canceled') {
            field.ownerDocument.addEventListener(
              'reset',
              (event) => {
                field.ownerDocument.getElementById(peerId).form.reset();
                event.preventDefault();
              },
              { once: true },
            );
          }
          form.reset();
          const restored = [field.value, new FormData(form).get('note'), field.validity.valid];
          if (timing === 'microtask') {
            await Promise.resolve();
          }
          if (timing === 'new edit' || timing === 'reinserted') {
            field.setRangeText(
              timing === 'reinserted' ? previous : 'Newer revision',
              0,
              field.value.length,
              'end',
            );
            field.dispatchEvent(new InputEvent('input', { bubbles: true }));
          }
          form.requestSubmit();
          form.removeEventListener('submit', readSubmit);
          await new Promise((done) => setTimeout(() => requestAnimationFrame(done), 0));
          return {
            restored,
            submissions,
            value: field.value,
            message: form.querySelector('[role="status"]').textContent,
          };
        },
        { timing, peerId },
      );
      assert.deepEqual(
        result.restored,
        timing === 'canceled' ? [previous, previous, false] : [opening, opening, true],
      );
      if (timing === 'canceled' || timing === 'reinserted') {
        assert.deepEqual(result.submissions, []);
        assert.equal(result.value, previous);
        assert.match(result.message, /^Remove 1 character/u);
        if (timing === 'canceled') {
          assert.equal(await receipt.textContent(), 'Submitted draft: Newer revision');
        } else {
          assert.equal(await receipt.count(), 0);
        }
      } else {
        const expected = timing === 'new edit' ? 'Newer revision' : opening;
        assert.deepEqual(result.submissions, [[expected, expected]]);
        assert.equal(result.value, expected);
        assert.equal(await receipt.textContent(), 'Submitted draft: ' + expected);
        assert.equal(result.message, 'Draft saved.');
      }
      if (timing === 'canceled') {
        assert.equal(await peer.inputValue(), opening);
        await peer.fill('Independent draft');
      } else {
        assert.equal(await peer.inputValue(), 'Independent draft');
      }
    }
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
