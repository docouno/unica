import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys, submitForm } from '../helpers.mjs';

const button = (scope, name) => scope.getByRole('button', { name, exact: true });
const form = (scope, name) => scope.getByRole('form', { name, exact: true });
const list = (scope, name) => scope.getByRole('listbox', { name, exact: true });
const option = (scope, name) => scope.getByRole('option', { name, exact: true });
const popup = (scope) => scope.locator('[popover="auto"]:popover-open');
const textbox = (scope, name) => scope.getByRole('textbox', { name, exact: true });
const entries = (owner) => owner.evaluate((node) => [...new FormData(node)]);
const readLog = async (page, name) => JSON.parse(await page.getByTestId(name).textContent());

async function assertActive(owner, row) {
  assert.equal(await row.count(), 1);
  const id = await row.getAttribute('id');
  assert.ok(id, 'The active row needs an ID');
  assert.equal(await owner.getAttribute('aria-activedescendant'), id);
}

async function assertPopupRelation(trigger, target, kind) {
  const id = await target.getAttribute('id');
  assert.ok(id, 'The popup target needs an ID');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await trigger.getAttribute('aria-haspopup'), kind);
  assert.equal(await trigger.getAttribute('aria-controls'), id);
}

async function resetWithSnapshots(owner) {
  return owner.evaluate((node) => {
    const read = () => [...new FormData(node)];
    node.addEventListener('reset', (event) => event.preventDefault(), { once: true });
    node.reset();
    const cancelled = read();
    node.reset();
    const applied = read();
    node.reset();
    return { cancelled, applied, repeated: read() };
  });
}

export default {
  'Pickers write FormData before uncontrolled callbacks and preserve owner authority and native reset order':
    async ({ page, mount }) => {
      await mount('pickers');
      const owner = form(page, 'Ordered answers');
      const trigger = button(owner, 'Ordered roles');
      const controls = list(owner, 'Controlled role');
      const a = ['role', 'a'];
      const b = ['role', 'b'];
      const reviewer = ['reviewer', 'a'];
      assert.deepEqual(await entries(owner), [a, b, reviewer]);

      const carrier = await owner.locator('select[name="role"]').elementHandle();
      await trigger.click();
      await option(popup(owner), 'Alpha').click();
      await option(popup(owner), 'Alpha').click();
      assert.deepEqual(await readLog(page, 'picker-answers-log'), [
        { phase: 'ordered', next: ['b'], entries: [b, reviewer] },
        { phase: 'ordered', next: ['b', 'a'], entries: [b, a, reviewer] },
      ]);
      assert.deepEqual(await resetWithSnapshots(owner), {
        cancelled: [b, a, reviewer],
        applied: [a, b, reviewer],
        repeated: [a, b, reviewer],
      });
      await popup(owner).waitFor({ state: 'hidden' });
      assert.equal(
        await owner
          .locator('select[name="role"]')
          .evaluate((node, earlier) => node === earlier, carrier),
        true,
      );
      await carrier.dispose();

      await option(controls, 'Beta').click();
      assert.equal(await option(controls, 'Alpha').getAttribute('aria-selected'), 'true');
      await button(owner, 'Remap controlled answer').click();
      await option(controls, 'Beta').click();
      const remapped = ['reviewer', 'c'];
      assert.deepEqual((await readLog(page, 'picker-answers-log')).slice(2), [
        { phase: 'proposed', next: 'b', entries: [a, b, reviewer] },
        { phase: 'proposed', next: 'b', entries: [a, b, reviewer] },
        { phase: 'remapped', next: 'b', entries: [a, b, remapped] },
      ]);
      assert.deepEqual((await resetWithSnapshots(owner)).applied, [a, b, remapped]);

      await button(owner, 'Remove Alpha').click();
      assert.deepEqual(await entries(owner), [a, b, remapped]);
      await trigger.click();
      const panel = popup(owner);
      const unavailable = panel.getByRole('group', { name: 'Unavailable selection' });
      const orphan = option(unavailable, 'Alpha');
      assert.equal(await orphan.getAttribute('aria-selected'), 'true');
      assert.match(
        await orphan.evaluate(
          (node) =>
            node.ownerDocument.getElementById(node.getAttribute('aria-describedby')).textContent,
        ),
        /select to remove/i,
      );
      await orphan.click();
      await orphan.waitFor({ state: 'detached' });
      assert.deepEqual(await entries(owner), [b, remapped]);
      await pressKeys(page, 'Escape');
      await button(owner, 'Reset roles').click();
      assert.deepEqual(await entries(owner), [a, b, remapped]);
      await button(owner, 'Restore Alpha').click();
      await trigger.click();
      assert.equal(await option(popup(owner), 'Alpha').getAttribute('aria-selected'), 'true');
      assert.equal(await unavailable.count(), 0);
    },

  'Listbox has one tab stop and keeps selection separate from label-only navigation': async ({
    page,
    mount,
  }) => {
    await mount('pickers');
    const owner = form(page, 'Ordered answers');
    const choices = list(owner, 'Controlled role');
    const before = button(owner, 'Ordered roles');
    const after = button(owner, 'Reset roles');
    const alpha = option(choices, 'Alpha');
    const name = await alpha.getAttribute('aria-labelledby');
    const description = await alpha.getAttribute('aria-describedby');
    assert.ok(name && description && name !== description);
    assert.equal(
      await alpha.evaluate(
        (node, id) => node.ownerDocument.getElementById(id).textContent,
        description,
      ),
      'Organization owner',
    );

    await before.focus();
    await pressKeys(page, 'Tab');
    await assertFocused(choices);
    await assertActive(choices, alpha);
    await pressKeys(page, 'b');
    await assertActive(choices, option(choices, 'Beta'));
    await pressKeys(page, 'b');
    await assertActive(choices, option(choices, 'Beacon'));
    await pressKeys(page, 'ArrowUp');
    await assertActive(choices, option(choices, 'Beta'));
    await button(owner, 'Disable Beta').evaluate((node) => node.click());
    await assertFocused(choices);
    await assertActive(choices, option(choices, 'Beacon'));
    await pressKeys(page, 'End', 'ArrowDown');
    await assertActive(choices, option(choices, 'Empty key'));
    assert.equal(await alpha.getAttribute('aria-selected'), 'true');
    assert.deepEqual(await readLog(page, 'picker-answers-log'), []);
    await pressKeys(page, 'Tab');
    await assertFocused(after);
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(choices);
    await assertActive(choices, alpha);
  },

  'Picker validation delegates native focus and honors disabled fieldsets, legend and form reassociation':
    async ({ page, mount }) => {
      await mount('pickers');
      const owner = form(page, 'Native choices');
      const other = form(page, 'Other owner');
      const trigger = button(owner, 'Required role');
      const members = list(owner, 'Required members');
      const earlier = textbox(owner, 'Earlier field');
      const submit = button(owner, 'Submit native choices');
      await submit.focus();
      assert.equal(await owner.evaluate((node) => node.checkValidity()), false);
      await assertFocused(submit);
      await owner.evaluate((node) => node.requestSubmit());
      await assertFocused(earlier);
      await earlier.fill('ready');
      await owner.evaluate((node) => node.requestSubmit());
      await assertFocused(trigger);
      await trigger.click();
      await option(popup(owner), 'Empty key').click();
      await assertFocused(trigger);
      assert.deepEqual(await entries(owner), [
        ['earlier', 'ready'],
        ['legend', 'a'],
        ['required-role', ''],
        ['external', 'a'],
      ]);
      await owner.evaluate((node) => node.requestSubmit());
      await assertFocused(members);

      await trigger.click();
      await popup(owner).waitFor();
      await button(page, 'Toggle fieldset').evaluate((node) => node.click());
      await popup(owner).waitFor({ state: 'hidden' });
      assert.equal(await trigger.isDisabled(), true);
      assert.equal(await members.getAttribute('aria-disabled'), 'true');
      assert.equal(await list(owner, 'Legend role').getAttribute('aria-disabled'), null);
      assert.equal(await owner.evaluate((node) => node.checkValidity()), true);
      await option(members, 'Beta').evaluate((node) => node.click());
      assert.deepEqual(await readLog(page, 'picker-constraints-log'), ['']);
      assert.deepEqual(await entries(owner), [
        ['earlier', 'ready'],
        ['legend', 'a'],
        ['external', 'a'],
      ]);

      await button(page, 'Toggle fieldset').click();
      await button(page, 'Toggle read only').click();
      assert.equal(await owner.evaluate((node) => node.checkValidity()), true);
      await trigger.click();
      await popup(owner).waitFor();
      await popup(owner).getByRole('listbox').focus();
      await pressKeys(page, 'Home', 'Enter', 'Escape');
      assert.deepEqual(await readLog(page, 'picker-constraints-log'), ['']);
      assert.deepEqual(await submitForm(owner, submit), [
        ['earlier', 'ready'],
        ['legend', 'a'],
        ['required-role', ''],
        ['external', 'a'],
      ]);

      const external = button(page, 'External picker');
      await external.click();
      await option(popup(page), 'Beta').click();
      await button(page, 'Move external owner').click();
      await owner.evaluate((node) => node.reset());
      assert.deepEqual(await entries(other), [['external', 'b']]);
      assert.deepEqual((await resetWithSnapshots(other)).applied, [['external', 'a']]);
    },

  'Select inside showModal admits a real hit target, protects composition and dismisses only the picker':
    async ({ page, mount }) => {
      await mount('pickers', { theme: 'frost-dark', surface: 'overlay' });
      await button(page, 'Open choices dialog').click();
      const modal = page.getByRole('dialog', { name: 'Invite collaborator' });
      const owner = form(modal, 'Invite form');
      const trigger = button(owner, 'Invite roles');
      const panel = popup(modal);
      const search = textbox(panel, 'Buscar');

      await trigger.focus();
      await pressKeys(page, 'ArrowDown');
      await panel.waitFor();
      await assertPopupRelation(trigger, panel, 'dialog');
      assert.equal(await panel.getAttribute('role'), 'dialog');
      assert.equal(await panel.getAttribute('data-surface'), 'overlay');
      assert.equal(await panel.evaluate((node) => node.closest('dialog').matches(':modal')), true);
      await assertFocused(search);
      const listbox = panel.getByRole('listbox');
      assert.equal(await search.getAttribute('aria-controls'), await listbox.getAttribute('id'));
      await assertActive(search, option(listbox, 'Alpha'));

      await search.fill('OWNER');
      assert.equal(await option(listbox, 'Alpha').count(), 1);
      assert.equal(await option(listbox, 'Beta').count(), 0);
      await button(panel, 'Borrar búsqueda').click();
      await assertFocused(search);
      assert.equal(await search.inputValue(), '');
      await search.fill('WORKSPACE');
      assert.equal(await option(listbox, 'Beta').count(), 1);
      await search.fill('');

      await search.evaluate((node) =>
        node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })),
      );
      await pressKeys(page, 'Enter');
      await search.evaluate((node) => {
        node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
        node.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true,
          }),
        );
      });
      assert.deepEqual(await entries(owner), [['invite-role', 'a']]);
      assert.equal(await page.getByTestId('picker-modal-submits').textContent(), '0');

      const beta = option(listbox, 'Beta');
      const box = await getBox(beta);
      assert.equal(
        await beta.evaluate(
          (row, { x, y }) => row.contains(row.ownerDocument.elementFromPoint(x, y)),
          {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
          },
        ),
        true,
      );
      await beta.click();
      await assertFocused(search);
      assert.deepEqual(await entries(owner), [
        ['invite-role', 'a'],
        ['invite-role', 'b'],
      ]);

      await search.fill('Beta');
      await pressKeys(page, 'Escape');
      await panel.waitFor({ state: 'hidden' });
      await modal.waitFor();
      await assertFocused(trigger);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert.deepEqual(await readLog(page, 'picker-modal-requests'), [true, false]);
      await pressKeys(page, 'Tab');
      await assertFocused(button(owner, 'After picker'));
      await button(owner, 'After picker').click();
      await trigger.click();
      await assertFocused(search);
      assert.equal(await search.inputValue(), '');
      await search.fill('Beta');
      const clearSelection = button(panel, 'Borrar selección');
      await clearSelection.click();
      await assertFocused(search);
      assert.equal(await search.inputValue(), 'Beta');
      assert.deepEqual(await entries(owner), []);
      await panel.getByText('0 elegidos', { exact: true }).waitFor();
      assert.equal(await clearSelection.count(), 0);
      await option(panel, 'Beta').click();
      await button(owner, 'After picker').click();
      await panel.waitFor({ state: 'hidden' });
      await assertFocused(button(owner, 'After picker'));
      assert.deepEqual(await entries(owner), [['invite-role', 'b']]);
    },

  'Select leaves the modal and ordinary Tab order intact with and without search': async ({
    page,
    mount,
  }) => {
    await mount('pickers');
    await button(page, 'Open choices dialog').click();
    const modal = page.getByRole('dialog', { name: 'Invite collaborator' });
    const plain = button(modal, 'Invite kind');
    await plain.focus();
    await pressKeys(page, 'Space');
    const panel = popup(modal);
    const choices = panel.getByRole('listbox');
    await choices.waitFor();
    await assertPopupRelation(plain, choices, 'listbox');
    await assertFocused(choices);
    await pressKeys(page, 'Tab');
    await assertFocused(button(modal, 'Submit invite'));
    await panel.waitFor({ state: 'hidden' });

    const rich = button(modal, 'Invite roles');
    await rich.click();
    const search = textbox(panel, 'Buscar');
    const clear = button(panel, 'Borrar selección');
    await assertFocused(search);
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(clear);
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(rich);
    await panel.waitFor({ state: 'hidden' });
    await button(modal, 'After picker').click();
    await rich.click();
    await pressKeys(page, 'Tab');
    await assertFocused(button(modal, 'After picker'));
    await panel.waitFor({ state: 'hidden' });

    await button(modal, 'Close invite').click();
    const owner = form(page, 'Ordered answers');
    const ordinary = button(owner, 'Ordered roles');
    await ordinary.focus();
    await pressKeys(page, 'Enter');
    const ordinaryPanel = popup(owner);
    const ordinarySearch = textbox(ordinaryPanel, 'Search options');
    await assertFocused(ordinarySearch);
    await pressKeys(page, 'Tab');
    await assertFocused(list(owner, 'Controlled role'));
    await ordinaryPanel.waitFor({ state: 'hidden' });
    await ordinary.focus();
    await pressKeys(page, 'ArrowUp');
    await assertFocused(ordinarySearch);
    await pressKeys(page, 'Shift+Tab', 'Shift+Tab');
    await assertFocused(ordinary);
    await ordinaryPanel.waitFor({ state: 'hidden' });
  },

  'Select keeps a saved answer through loading, search, error, retry and explicit unavailable removal':
    async ({ page, mount }) => {
      await mount('pickers');
      const owner = form(page, 'Async answers');
      const trigger = button(owner, 'Async roles');
      const panel = popup(owner);
      const search = textbox(panel, 'Buscar');
      const clearSelection = button(panel, 'Borrar selección');
      const resolve = button(page, 'Resolve catalog');
      const saved = [['saved', 'a']];
      assert.equal(await trigger.getAttribute('aria-haspopup'), 'dialog');
      assert.match(await trigger.getAttribute('title'), /Propietaria guardada/);
      await trigger.click();
      await assertPopupRelation(trigger, panel, 'dialog');
      await assertFocused(panel);
      const loading = panel.getByText('Cargando opciones…', { exact: true });
      await loading.waitFor();
      const hasSpinnerMotion = () =>
        loading.evaluate((node) =>
          node
            .closest('[role="status"]')
            ?.getAnimations({ subtree: true })
            .some((animation) => animation.effect.getTiming().iterations === Infinity),
        );
      assert.equal(await hasSpinnerMotion(), true);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await hasSpinnerMotion(), false);
      assert.equal(await panel.getByRole('listbox').count(), 0);
      assert.equal(await search.count(), 0);
      assert.deepEqual(await entries(owner), saved);
      await resolve.evaluate((node) => node.click());
      await panel.getByRole('listbox').waitFor();
      await assertFocused(panel.getByRole('listbox'));
      await assertPopupRelation(trigger, panel, 'dialog');
      await button(page, 'Clear catalog').evaluate((node) => node.click());
      await assertFocused(panel.getByRole('listbox'));
      await button(page, 'Reload empty catalog').evaluate((node) => node.click());
      await loading.waitFor();
      await assertFocused(panel);
      assert.deepEqual(await entries(owner), saved);
      await resolve.evaluate((node) => node.click());
      await panel.getByRole('listbox').waitFor();
      await assertFocused(panel.getByRole('listbox'));
      await pressKeys(page, 'Escape');
      await panel.waitFor({ state: 'hidden' });

      await button(page, 'Enable search').click();
      await trigger.click();
      await assertFocused(search);
      await search.fill('missing');
      await panel.getByText('No se encontró «missing»', { exact: true }).waitFor();
      await panel.getByText('Prueba otro nombre', { exact: true }).waitFor();
      assert.equal(await panel.getByRole('option').count(), 0);
      await button(panel, 'Borrar búsqueda').click();
      await search.fill('Beta');
      await button(page, 'Refresh catalog').evaluate((node) => node.click());
      await panel.getByText('Actualizando opciones…', { exact: true }).waitFor();
      assert.equal(await clearSelection.isDisabled(), true);
      assert.equal(await option(panel, 'Beta').count(), 1);
      await pressKeys(page, 'Enter');
      assert.deepEqual(await entries(owner), saved);

      await button(page, 'Fail catalog').evaluate((node) => node.click());
      const retry = button(panel, 'Reintentar');
      await retry.waitFor();
      await assertFocused(retry);
      assert.equal(await search.isDisabled(), true);
      assert.equal(await search.inputValue(), 'Beta');
      await retry.click();
      await assertFocused(search);
      assert.equal(await search.inputValue(), 'Beta');
      assert.deepEqual(await entries(owner), saved);

      await button(page, 'Clear catalog').evaluate((node) => node.click());
      await button(panel, 'Borrar búsqueda').click();
      const group = panel.getByRole('group', { name: 'Selecciones no disponibles' });
      const retained = option(group, 'Alpha');
      assert.equal(await retained.getAttribute('aria-selected'), 'true');
      await retained.click();
      await panel.waitFor({ state: 'hidden' });
      assert.deepEqual(await entries(owner), []);
      await assertFocused(trigger);
      await button(page, 'Toggle async disabled').click();
      assert.equal(await trigger.isDisabled(), true);
      assert.notEqual(await trigger.getAttribute('aria-invalid'), 'true');
    },

  'Touch Select opens without focusing an input and async completion honors the input modality':
    async ({ page, mount, origin, watchPage }) => {
      const context = await page
        .context()
        .browser()
        .newContext({
          hasTouch: true,
          viewport: { width: 400, height: 800 },
        });
      try {
        const touch = watchPage(await context.newPage());
        const url = new URL('/test/browser/index.html', origin);
        url.search = new URLSearchParams({ fixture: 'pickers', theme: 'pixel-light' });
        await touch.goto(url.href);
        await touch.locator('[data-browser-ready]').waitFor();
        const owner = form(touch, 'Async answers');
        const resolve = button(touch, 'Resolve catalog');
        const trigger = button(owner, 'Async roles');
        const panel = popup(owner);
        const search = textbox(panel, 'Buscar');
        await button(touch, 'Enable search').click();
        await trigger.tap();
        await panel.waitFor();
        await assertFocused(panel);
        await resolve.evaluate((node) => node.click());
        await panel.getByRole('listbox').waitFor();
        await assertFocused(panel.getByRole('listbox'));
        assert.ok((await getBox(option(panel, 'Beta'))).height >= 44);
        assert.ok((await getBox(button(panel, 'Borrar selección'))).height >= 44);
        await search.tap();
        await assertFocused(search);
        await touch.keyboard.press('Escape');
        await panel.waitFor({ state: 'hidden' });
      } finally {
        await context.close();
      }

      await mount('pickers');
      const outside = button(page, 'After async picker');
      const owner = form(page, 'Async answers');
      await button(owner, 'Async roles').click();
      await popup(owner).waitFor();
      await outside.click();
      await popup(owner).waitFor({ state: 'hidden' });
      await assertFocused(outside);
      await button(page, 'Resolve catalog').evaluate((node) => node.click());
      await assertFocused(outside);
    },

  'Select stays on its flipped side through filtering and repositions when that side loses space':
    async ({ page, mount }) => {
      await mount('picker-geometry', {
        theme: 'pixel-dark',
        direction: 'rtl',
        textScale: 120,
        forcedColors: 'active',
        reducedMotion: 'reduce',
      });
      const trigger = button(page, 'Positioned choices');
      const initial = await getBox(trigger);
      await trigger.click();
      const panel = popup(page);
      const search = textbox(panel, 'Search options');
      await search.waitFor();
      await page.waitForFunction(
        () => document.querySelector('[popover]:popover-open')?.dataset.side === 'top',
      );
      const top = await getBox(panel);
      assert.ok(Math.abs(top.y + top.height + 8 - initial.y) <= 1);
      assert.ok(Math.abs(top.x + top.width - (initial.x + initial.width)) <= 1);
      assert.ok(top.width >= 264);
      const choices = panel.getByRole('listbox');
      assert.equal(await choices.evaluate((node) => node.scrollHeight > node.clientHeight), true);
      await search.fill('Target result');
      await option(choices, 'Target result').waitFor();
      await page.waitForFunction(
        (reference) => {
          const box = document.querySelector('[popover]:popover-open')?.getBoundingClientRect();
          return (
            box && box.height < reference.height && Math.abs(box.bottom + 8 - reference.y) <= 1
          );
        },
        { height: top.height, y: initial.y },
      );
      const filtered = await getBox(panel);
      assert.ok(filtered.height < top.height);
      assert.ok(Math.abs(filtered.y + filtered.height + 8 - initial.y) <= 1);
      assert.equal(await choices.evaluate((node) => node.scrollHeight <= node.clientHeight), true);
      await page.setViewportSize({ width: 800, height: 1200 });
      await page.waitForFunction(
        () => document.querySelector('[popover]:popover-open')?.dataset.side === 'bottom',
      );
      const after = await getBox(panel);
      const moved = await getBox(trigger);
      assert.ok(Math.abs(after.y - (moved.y + moved.height + 8)) <= 1);
      await button(page, 'Remove anchor').evaluate((node) => node.click());
      await panel.waitFor({ state: 'hidden' });
    },

  'Select reveals its initial active option after the viewport constrains the list': async ({
    page,
    mount,
  }) => {
    await mount('picker-geometry');
    await page.setViewportSize({ width: 480, height: 460 });
    await page.getByTestId('positioned-anchor').evaluate((node) => {
      node.style.marginBlockStart = '150px';
    });
    const trigger = button(page, 'Positioned choices');
    const scrollY = await page.evaluate(() => window.scrollY);
    await trigger.press('ArrowDown');
    const panel = popup(page);
    const rail = panel.getByRole('listbox');
    const selected = option(rail, 'Option 38');
    const search = textbox(panel, 'Search options');
    await assertFocused(search);
    await assertActive(search, selected);
    const id = await selected.getAttribute('id');
    await page.waitForFunction((optionId) => {
      const row = document.getElementById(optionId);
      const list = row?.closest('[role="listbox"]');
      if (!row || !list || list.clientHeight >= 22 * 16) {
        return false;
      }
      const viewport = list.getBoundingClientRect();
      const active = row.getBoundingClientRect();
      return active.top >= viewport.top - 1 && active.bottom <= viewport.bottom + 1;
    }, id);
    assert.equal(await page.evaluate(() => window.scrollY), scrollY);
  },

  'Pickers retain real option density, a full accessible summary and forced-colors focus': async ({
    page,
    mount,
  }) => {
    await mount('picker-geometry', { theme: 'pixel-light', forcedColors: 'active' });
    for (const [size, expected] of [
      ['s', 30],
      ['m', 40],
      ['l', 48],
    ]) {
      const choices = list(page, `Row size ${size}`);
      const row = option(choices, 'One');
      assert.equal((await getBox(row)).height, expected);
      assert.equal(await row.getAttribute('aria-selected'), 'true');
      await choices.focus();
      await pressKeys(page, 'Home');
      await assertActive(choices, row);
      assert.equal(
        await row.evaluate((node) => {
          const style = getComputedStyle(node);
          return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
        }),
        true,
      );
    }
    const summary = button(page, 'Long saved choices');
    assert.equal(await summary.getAttribute('title'), 'Alpha, Beta, Beacon, Charlie, Delta');
    assert.match(await summary.textContent(), /\+\d/);
    assert.equal(await summary.evaluate((node) => node.scrollWidth <= node.clientWidth + 2), true);
  },

  'Closed pickers submit on first server paint and hydrate the same native carrier': async ({
    page,
    mount,
    renderFixture,
  }) => {
    await mount('pickers');
    const host = page.getByTestId('picker-hydration-root');
    const markup = await renderFixture('picker-ssr');
    await host.evaluate((node, html) => {
      node.innerHTML = html;
    }, markup);
    const owner = form(host, 'Server choices');
    const trigger = button(owner, 'Backup roles');
    const saved = [
      ['backup', 'b'],
      ['backup', ''],
      ['compound', ''],
      ['role-list', 'a'],
    ];
    assert.deepEqual(await entries(owner), saved);
    assert.match(await trigger.getAttribute('title'), /Backup beta.*Backup empty/);
    assert.equal(await owner.evaluate((node) => node.checkValidity()), true);
    const carrier = await owner.locator('select[name="backup"]').elementHandle();
    await button(page, 'Hydrate pickers').click();
    await trigger.click();
    const panel = popup(owner);
    const group = panel.getByRole('group', { name: 'Selecciones no disponibles' });
    assert.equal(await option(group, 'Backup beta').getAttribute('aria-selected'), 'true');
    assert.equal(await option(group, 'Backup empty').getAttribute('aria-selected'), 'true');
    assert.equal(
      await owner
        .locator('select[name="backup"]')
        .evaluate((node, original) => node === original, carrier),
      true,
    );
    await carrier.dispose();
    assert.deepEqual(await entries(owner), saved);
    assert.equal(await page.getByTestId('picker-hydration-errors').textContent(), '');
  },
};
