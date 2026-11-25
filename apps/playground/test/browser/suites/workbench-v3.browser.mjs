import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

async function navigate(page, params) {
  await page.evaluate((nextParams) => {
    document.documentElement.removeAttribute('data-wb-ready');
    const url = new URL(window.location.href);
    url.search = '';
    for (const [key, value] of Object.entries(nextParams)) {
      url.searchParams.set(key, value);
    }
    history.pushState(null, '', url);
    dispatchEvent(new PopStateEvent('popstate'));
  }, params);
}

export default {
  'TagsInput renders its mixed-script tags in the offline workbench': async ({ page, origin }) => {
    const route = new URL(
      '/?item=tags-input&tab=states&block=overflow&family=soft&scheme=light&dir=rtl',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const board = page.locator('section[data-wb-block="overflow"] .wb-artboard').first();
    const words = ['العمارة', 'עברית', '東京'];
    await board.getByText(words[2], { exact: true }).waitFor({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    for (const word of words) {
      const missing = await board.getByText(word, { exact: true }).evaluate((label) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const style = getComputedStyle(label);
        context.font = style.fontWeight + ' 36px ' + style.fontFamily;
        function draw(character) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillText(character, 8, 50);
          return canvas.toDataURL();
        }
        const missingGlyph = draw('\u0378');
        return [...new Set(label.textContent)].filter(
          (character) => draw(character) === missingGlyph,
        );
      });
      assert.deepEqual(missing, [], 'Every character in ' + word + ' has a glyph');
    }
  },

  'TagsInput keeps the draft text beside Add when the matrix scales down': async ({
    page,
    origin,
  }) => {
    await page.setViewportSize({ width: 1500, height: 950 });
    const route = new URL(
      '/?item=tags-input&tab=states&block=drafts&vp=1440&dir=rtl&scale=120&surface=overlay',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const board = page.locator('section[data-wb-block="drafts"] .wb-artboard').first();
    const field = board
      .locator('.tags-editor-proto[data-size="l"][data-variant="default"]')
      .first();
    const input = field.getByRole('textbox');
    await input.waitFor({ timeout: 20_000 });
    await input.fill('One\nTwo\nThree\nSummer collection acquisitions — ' + 'W'.repeat(250));
    await input.blur();
    const textEdge = await input.evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        element.getBoundingClientRect().left +
        (element.clientLeft + Number.parseFloat(style.paddingLeft)) * element.currentCSSZoom
      );
    });
    const add = await field.getByRole('button', { name: 'Add tags' }).boundingBox();
    assert.ok(
      add && textEdge >= add.x + add.width - 1,
      'The RTL editing area ends before the Add button',
    );
  },

  'Select shows the remaining choices in a scaled narrow field': async ({ page, origin }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    const route = new URL(
      '/?item=select&tab=states&block=summary&vp=1440&dir=rtl&scale=120',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const field = page.getByRole('button', { name: /^Filter regions: Amsterdam/ }).first();
    await field.waitFor({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    assert.match(await field.getAttribute('aria-label'), /Frankfurt.*London.*Stockholm/);
    assert.equal(
      await field.getByText('Amsterdam', { exact: true }).filter({ visible: true }).count(),
      1,
    );
    assert.equal(await field.getByText('+4', { exact: true }).filter({ visible: true }).count(), 1);
  },

  'Select retry restores the shared catalog and keeps the saved choices': async ({
    page,
    origin,
  }) => {
    const route = new URL(
      '/?item=select&tab=states&block=loading&family=frost&scheme=both',
      origin,
    );
    await page.goto(route.href, { waitUntil: 'domcontentloaded' });
    const frame = page.locator('section[data-wb-block="loading"]');
    const boards = frame.locator('.wb-artboard');
    const retry = boards.getByRole('button', { name: 'Try again' });
    await retry.first().waitFor({ timeout: 20_000 });
    assert.equal(await retry.count(), 2);
    const fields = boards.getByRole('button', { name: 'Available regions: London' });
    assert.equal(await fields.count(), 2);
    await retry.first().press('Enter');
    assert.equal(await retry.count(), 0, 'Retry recovers the catalog in both themes');
    assert.equal(await frame.getByRole('combobox').inputValue(), 'ready');
    assert.equal(await fields.count(), 2);
    const list = boards.first().locator('[role="listbox"]:focus');
    const selected = list.getByRole('option', { name: 'London', exact: true, selected: true });
    const selectedId = await selected.getAttribute('id');
    assert.ok(selectedId);
    assert.equal(await list.getAttribute('aria-activedescendant'), selectedId);
    await list.press('ArrowDown');
    assert.notEqual(await list.getAttribute('aria-activedescendant'), selectedId);
    assert.equal(await selected.count(), 1, 'Browsing another row keeps London selected');
  },

  'Date pickers select the touched day at the edge of an in-flow calendar on a phone': async ({
    page,
    origin,
  }) => {
    const touch = await page
      .context()
      .browser()
      .newContext({
        hasTouch: true,
        isMobile: true,
        viewport: { width: 360, height: 780 },
      });
    try {
      const mobile = await touch.newPage();
      const view = {
        tab: 'states',
        family: 'frost',
        scheme: 'light',
        dir: 'rtl',
        scale: '120',
      };
      for (const [item, block, expected] of [
        ['date-picker', 'panels', '07/09/2026'],
        ['date-picker', 'anatomy', '07/09/2026'],
        ['date-range-picker', 'panels', '07/09/2026 – 13/09/2026'],
      ]) {
        const params = { ...view, item, block };
        if (mobile.url() === 'about:blank') {
          const route = new URL('/', origin);
          route.search = new URLSearchParams(params).toString();
          await mobile.goto(route.href, { waitUntil: 'domcontentloaded' });
        } else {
          await navigate(mobile, params);
        }
        const field = mobile
          .locator(`[data-wb-block="${block}"] .wb-artboard .date-picker-proto`)
          .first();
        const seventh = field.locator('button[data-date="2026-09-07"]');
        const eighth = field.locator('button[data-date="2026-09-08"]');
        await seventh.waitFor({ timeout: 20_000 });
        await mobile.evaluate(() => document.fonts.ready);
        await seventh.scrollIntoViewIfNeeded();
        const day = await seventh.boundingBox();
        const neighbor = await eighth.boundingBox();
        assert.ok(day && neighbor);
        await mobile.touchscreen.tap(day.x + 1.5, day.y + day.height / 2);
        const editor = field.getByRole('textbox');
        if (item === 'date-range-picker') {
          assert.equal(await editor.inputValue(), '');
          await field.locator('button[data-date="2026-09-13"]').tap();
        }
        await seventh.waitFor({ state: 'detached' });
        assert.equal(await editor.inputValue(), expected, item + '/' + block);
        assert.ok(day.width >= 44 && day.height >= 44);
        assert.ok(
          neighbor.x + neighbor.width <= day.x + 0.01,
          'The adjacent day has its own touch target',
        );
      }
    } finally {
      await touch.close();
    }
  },

  'SegmentedControl keeps the submitted frequency when a native reset is canceled': async ({
    page,
    origin,
  }) => {
    await page.goto(
      new URL('/?item=segmented-control&tab=states&block=field&family=soft&scheme=light', origin)
        .href,
      { waitUntil: 'domcontentloaded' },
    );
    const form = page.locator('[data-wb-block="field"] .wb-artboard form');
    const weekly = form.getByRole('radio', { name: 'Weekly', exact: true });
    await weekly.waitFor({ timeout: 20_000 });
    await weekly.press('Space');
    await form.locator('button[type="submit"]').press('Enter');
    const receipt = form.getByRole('status').filter({ hasText: /weekly/i });
    await receipt.waitFor();
    await page.evaluate(() =>
      document.addEventListener('reset', (event) => event.preventDefault(), { once: true }),
    );
    const reset = form.locator('button[type="reset"]');
    await reset.press('Enter');
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(await weekly.isChecked(), true);
    assert.equal(await receipt.count(), 1, 'A canceled reset preserves the submitted frequency');

    await reset.press('Enter');
    await receipt.waitFor({ state: 'hidden' });
    assert.equal(await weekly.isChecked(), false);
  },

  'FileInput submits dropped bytes and follows the actual form owner on reset': async ({
    page,
    mount,
  }) => {
    await mount('native');
    await page.goto(
      new URL('/?item=file-input&tab=playground&family=soft&scheme=light', page.url()).href,
      { waitUntil: 'domcontentloaded' },
    );
    const board = page.locator('.wb-artboard').first();
    const picker = board.getByRole('button', { name: 'Choose file Attach evidence' });
    const input = board.locator('input[type="file"]');
    await picker.waitFor({ timeout: 20_000 });
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), picker.press('Enter')]);
    await chooser.setFiles({
      name: 'first.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('First'),
    });
    await board.getByRole('button', { name: 'Remove first.txt' }).waitFor();
    await input.evaluate((node) => {
      const owner = document.createElement('form');
      owner.id = 'external-attachment-owner';
      document.body.appendChild(owner);
      node.setAttribute('form', owner.id);
    });
    async function drop(names) {
      await board.locator('.file-input-proto').evaluate((target, names) => {
        const dataTransfer = new DataTransfer();
        for (const name of names) {
          dataTransfer.items.add(new File([name], name, { type: 'text/plain' }));
        }
        target.dispatchEvent(
          new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }),
        );
      }, names);
    }
    const read = () =>
      input.evaluate(async (node) => {
        const entry = new FormData(node.form).get('attachment');
        return { name: entry.name, text: await entry.text() };
      });
    await drop(['ثاني.txt']);
    await board.getByRole('button', { name: 'Remove ثاني.txt' }).waitFor();
    assert.deepEqual(await read(), { name: 'ثاني.txt', text: 'ثاني.txt' });
    await drop(['three.txt', 'four.txt']);
    await board.getByRole('status').filter({ hasText: 'Drop one file at a time' }).waitFor();
    assert.deepEqual(await read(), { name: 'ثاني.txt', text: 'ثاني.txt' });
    await input.evaluate((node) => {
      node.closest('form').reset();
      node.form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      node.form.reset();
    });
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.deepEqual(await read(), { name: 'ثاني.txt', text: 'ثاني.txt' });
    assert.equal(await board.getByRole('button', { name: 'Remove ثاني.txt' }).count(), 1);
    await input.evaluate((node) => {
      node.form.reset();
      node.form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      node.form.reset();
    });
    await board.getByRole('button', { name: 'Remove ثاني.txt' }).waitFor({ state: 'detached' });
    assert.deepEqual(await read(), { name: '', text: '' });
    assert.equal(
      await board.getByRole('status').filter({ hasText: 'Drop one file at a time' }).count(),
      0,
    );
  },

  'Bounds follows an inline link when its web font replaces the fallback': async ({
    page,
    mount,
  }) => {
    await mount('native');
    const url = new URL('/?item=link&tab=usage&family=frost&scheme=light', page.url());
    await page.goto(url.href, { waitUntil: 'commit' });
    await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 20_000 });

    const font = '**/inter-latin-wght-italic.woff2';
    let releaseFont;
    const fontGate = new Promise((resolve) => {
      releaseFont = resolve;
    });
    await page.route(font, async (route) => {
      await fontGate;
      await route.continue();
    });

    const board = page.locator('[data-wb-block="glyphs"] .wb-artboard');
    const link = board.getByRole('link', { name: 'Writing for Web Accessibility' });
    const outline = board.locator('.wb-bounds-outline').first();
    const label = outline.locator('[data-wb-bounds-label]');
    let fallbackWidth;
    try {
      const requested = page.waitForRequest(font, { timeout: 20_000 });
      await navigate(page, {
        item: 'link',
        tab: 'states',
        block: 'glyphs',
        family: 'frost',
        scheme: 'light',
        vp: '360',
        dir: 'rtl',
        scale: '120',
        bounds: '1',
      });
      await requested;
      await label.waitFor({ timeout: 20_000 });
      fallbackWidth = await link.evaluate((node) => node.offsetWidth);
    } finally {
      releaseFont();
    }

    await page.evaluate(() => document.fonts.ready);
    const size = await link.evaluate((node) => [node.offsetWidth, node.offsetHeight]);
    assert.notEqual(size[0], fallbackWidth);
    await label.filter({ hasText: size.join(' × ') + ' px' }).waitFor({ timeout: 4_000 });
    const outlineSize = await outline.evaluate((node) => [
      Math.round(parseFloat(node.style.width)),
      Math.round(parseFloat(node.style.height)),
    ]);
    assert.deepEqual(outlineSize, size);
  },

  'Link section addresses survive a new tab and track native history': async ({ page, mount }) => {
    await mount('workbench-v3');
    await navigate(page, {
      ...Object.fromEntries(new URL(page.url()).searchParams),
      item: 'link',
      tab: 'states',
      block: 'live',
      solo: 'frost-light',
    });
    const path = page.getByRole('navigation', { name: 'On this example' });
    const details = path.getByRole('link', { name: 'Details' });
    const original = page.url();
    const [opened] = await Promise.all([
      page.context().waitForEvent('page'),
      details.click({ modifiers: ['Control'] }),
    ]);
    try {
      const target = opened.getByRole('region', { name: 'Details', exact: true });
      const navigation = opened.getByRole('navigation', { name: 'On this example' });
      const current = navigation.locator('[aria-current="location"]');
      await target.waitFor();
      assert.equal(await target.evaluate((element) => element.matches(':focus')), true);
      assert.equal(await current.textContent(), 'Details');
      assert.equal(page.url(), original);
      await navigation.getByRole('link', { name: 'Summary' }).press('Enter');
      await current.filter({ hasText: 'Summary' }).waitFor();
      await opened.goBack();
      await current.filter({ hasText: 'Details' }).waitFor();
      await opened.reload({ waitUntil: 'domcontentloaded' });
      await target.waitFor();
      assert.equal(await target.evaluate((element) => element.matches(':focus')), true);
      assert.equal(await current.textContent(), 'Details');
    } finally {
      await opened.close();
    }
  },

  'Tag removal and restoration keep keyboard focus in the activated artboard': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1500, height: 900 });
    await mount('workbench-v3');
    await navigate(page, { item: 'tag', tab: 'playground', family: 'frost', scheme: 'both' });
    const boards = page.locator('.wb-artboard');
    const remove = boards.nth(1).getByRole('button', { name: 'Remove Documentation' });
    const restore = boards.nth(1).getByRole('button', { name: 'Restore tag' });
    await remove.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    assert.equal(await restore.evaluate((button) => button.matches(':focus')), true);
    assert.equal(await boards.nth(1).locator('[data-wb-subject]').count(), 0);
    await page.keyboard.press('Space');
    assert.equal(await remove.evaluate((button) => button.matches(':focus')), true);
    assert.equal(await boards.nth(1).locator('.tag-proto[data-wb-subject]').count(), 1);
    assert.equal(
      await boards.nth(0).getByRole('button', { name: 'Remove Documentation' }).count(),
      1,
    );
    const label = page.getByRole('textbox', { name: 'label', exact: true });
    await label.fill('   ');
    await boards.nth(1).getByRole('button', { name: 'Remove Label' }).waitFor();
    assert.equal(await label.evaluate((input) => input.matches(':focus')), true);
  },

  'Settling two TagGroup removals retains focus in the group that owned it': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount('workbench-v3');
    await navigate(page, {
      item: 'tag',
      tab: 'states',
      block: 'removal',
      family: 'frost',
      scheme: 'both',
    });
    const frame = page.locator('[data-wb-block="removal"]');
    const groups = frame.getByRole('toolbar', { name: 'Applied labels' });
    await frame.getByRole('checkbox', { name: 'Wait for confirmation' }).check();
    for (const group of [groups.nth(0), groups.nth(1)]) {
      await group.getByRole('button', { name: 'Remove Platform team' }).press('Delete');
    }
    // Activation through an assistive command can leave DOM focus in the collection.
    await frame
      .getByRole('button', { name: 'Confirm removal' })
      .evaluate((button) => button.click());
    const following = groups.nth(1).getByRole('button', { name: 'Remove Needs review' });
    assert.equal(await following.evaluate((button) => button.matches(':focus')), true);
    assert.equal(await groups.getByRole('button', { name: 'Remove Platform team' }).count(), 0);
    await frame.getByRole('checkbox', { name: 'Wait for confirmation' }).uncheck();
    await groups.nth(1).getByRole('button', { name: 'Remove This month' }).press('Delete');
    await following.focus();
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    const empty = frame
      .locator('.wb-artboard')
      .nth(1)
      .getByRole('button', { name: 'Reapply labels' });
    assert.equal(await empty.evaluate((button) => button.matches(':focus')), true);
    await page.keyboard.press('Enter');
    const first = groups.nth(1).getByRole('button', { name: 'Remove This month' });
    assert.equal(await first.evaluate((button) => button.matches(':focus')), true);
  },

  'Toast exports retain independent identities after an earlier notification is dismissed': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('workbench-v3');
    await navigate(page, {
      item: 'toast',
      tab: 'compositions',
      block: 'modal',
      family: 'frost',
      scheme: 'light',
      surface: 'overlay',
      vp: '360',
      scale: '120',
      dir: 'rtl',
    });
    const open = page.getByRole('button', { name: 'Open export options' });
    await open.press('Enter');
    const dialog = page.locator('dialog:modal');
    const queue = dialog.locator('[popover]:popover-open');
    const name = dialog.getByRole('textbox', { name: 'File name' });
    const prepare = dialog.getByRole('button', { name: 'Prepare export' });
    async function holdEnter(target) {
      await target.focus();
      await page.keyboard.down('Enter');
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await page.keyboard.down('Enter');
      await page.keyboard.up('Enter');
    }
    await name.fill('First report');
    await holdEnter(name);
    await dialog
      .getByRole('status')
      .filter({ hasText: 'First report.txt' })
      .waitFor({ state: 'attached' });
    await name.fill('Second report');
    await holdEnter(prepare);
    await queue.getByRole('button', { name: /^Expand 3 notifications/ }).press('Enter');
    const cards = queue.locator('.toast-card');
    assert.equal(await cards.count(), 3);
    await holdEnter(
      cards.filter({ hasText: 'First report.txt' }).getByRole('button', { name: /^Dismiss:/ }),
    );
    await name.fill('Third report');
    await prepare.press('Enter');
    assert.equal(await cards.count(), 3);
    await cards
      .filter({ hasText: 'Third report.txt' })
      .getByRole('button', { name: /^Dismiss:/ })
      .press('Enter');
    assert.equal(await cards.count(), 2);
    await cards.filter({ hasText: 'Second report.txt' }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await open.evaluate((button) => button.matches(':focus')), true);
    await open.press('Enter');
    const expand = queue.getByRole('button', { name: /^Expand 2 notifications/ });
    if (await expand.count()) {
      await expand.press('Enter');
    }
    await queue.locator('.toast-card').filter({ hasText: 'Second report.txt' }).waitFor();
    assert.equal(
      await queue.locator('.toast-card').filter({ hasText: 'Third report.txt' }).count(),
      0,
    );
    assert.equal(await dialog.getByRole('status').textContent(), '');
    await page.keyboard.press('Escape');
    const reset = page.getByRole('button', { name: 'Reset', exact: true });
    await reset.focus();
    await page.locator('.toast-dismiss-all').evaluate((button) => button.click());
    assert.equal(await reset.evaluate((button) => button.matches(':focus')), true);
  },

  'Dismissing a toast preserves focus owned by another message or artboard': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mount('workbench-v3');
    await navigate(page, {
      item: 'toast',
      tab: 'states',
      block: 'reading',
      family: 'frost',
      scheme: 'both',
    });
    const boards = page.locator('[data-wb-block="reading"] .wb-artboard');
    const first = boards.first();
    const close = first
      .locator('.toast-card')
      .first()
      .getByRole('button', { name: /^Dismiss:/ });
    const undo = first.getByRole('button', { name: 'Undo', exact: true });
    const next = boards.nth(1).getByRole('button', { name: 'Undo', exact: true });
    await undo.focus();
    await close.evaluate((button) => button.click());
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(await undo.evaluate((button) => button.matches(':focus')), true);
    await close.evaluate(
      (button, destination) => {
        button.focus();
        button.click();
        destination.focus();
      },
      await next.elementHandle(),
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(await next.evaluate((button) => button.matches(':focus')), true);
  },

  'Bounds follows the accordion when its header opens inside a composition': async ({
    page,
    mount,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mount('workbench-v3');
    await navigate(page, {
      item: 'accordion',
      tab: 'compositions',
      block: 'actions',
      family: 'frost',
      scheme: 'light',
      surface: 'overlay',
      vp: '360',
      scale: '120',
      dir: 'rtl',
      bounds: '1',
      freeze: '1',
    });
    const board = page.locator('[data-wb-block="actions"] .wb-artboard');
    const roots = board.locator('.accordion-proto[data-wb-subject]');
    await roots.first().waitFor();
    assert.equal(await roots.count(), 3);
    const before = await roots.first().evaluate((el) => [el.offsetWidth, el.offsetHeight]);
    await page
      .getByText(before.join(' × ') + ' px', { exact: true })
      .first()
      .waitFor();
    await board.getByRole('button', { name: 'Preview link', exact: true }).press('Enter');
    const url = board.getByText('https://preview.example.com/releases/2.4', { exact: true });
    await url.waitFor();
    const gapBelowUrl = await url.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return (
        element.nextElementSibling.getBoundingClientRect().top -
        range.getBoundingClientRect().bottom
      );
    });
    assert.ok(gapBelowUrl >= 0, 'The complete URL fits above the expiration note');
    await page.waitForFunction(([width, height]) => {
      const accordion = document.querySelector('[data-wb-block="actions"] .accordion-proto');
      if (!accordion || accordion.offsetWidth !== width || accordion.offsetHeight <= height) {
        return false;
      }
      const dimensions = `${width} × ${accordion.offsetHeight} px`;
      return [...document.querySelectorAll('[data-wb-bounds-label]')].some(
        (label) => label.textContent === dimensions,
      );
    }, before);
  },

  'Overlay disclosures stay under the pointer when their content opens': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mount('workbench-v3');
    for (const [route, name] of [
      [{ item: 'accordion', tab: 'playground' }, 'Fee'],
      [{ item: 'avatar', tab: 'compositions', block: 'usage' }, 'View all 7'],
    ]) {
      await navigate(page, {
        ...route,
        surface: 'overlay',
        family: 'frost',
        scheme: 'light',
        vp: '360',
        scale: '120',
        dir: 'rtl',
        raw: '1',
        freeze: '1',
      });
      const board = page.locator('.wb-artboard').first();
      const trigger = board.getByRole('button', { name, exact: true });
      await trigger.scrollIntoViewIfNeeded();
      const panelId = await trigger.getAttribute('aria-controls');
      assert.ok(panelId);
      const disclosure = board.locator(`button[aria-controls="${panelId}"]`);
      const bounds = await trigger.boundingBox();
      assert.ok(bounds);
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height * 0.85;
      await page.mouse.click(x, y);
      assert.equal(await disclosure.getAttribute('aria-expanded'), 'true');
      await page.mouse.click(x, y);
      assert.equal(await disclosure.getAttribute('aria-expanded'), 'false');
    }
  },

  'An AppShell save failure clears the shared control and preserves each workspace draft': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount('workbench-v3');
    await navigate(page, { item: 'app-shell', tab: 'states', block: 'save' });

    const frame = page.locator('[data-wb-block="save"]');
    const toolbar = frame.getByRole('group', { name: 'Save, discard and retry controls' });
    const fail = toolbar.getByRole('checkbox', { name: 'Simulate a save failure' });
    const artboards = frame.locator('.wb-artboard');
    const first = artboards.first();
    const fields = artboards.getByRole('textbox', { name: 'Workspace name' });
    await fields.first().waitFor();
    assert.equal(await fields.count(), 6);
    const initial = await fields.first().inputValue();
    const edited = 'Editorial workspace';
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await fields.first().fill(edited);
    await fail.check();
    await first.getByRole('button', { name: 'Save changes' }).click();
    assert.equal(await fail.isChecked(), false);
    const second = artboards.nth(1);
    await second.getByRole('button', { name: 'Save changes' }).click();
    await page.clock.runFor(700);
    await second.getByText('All changes saved', { exact: true }).waitFor();
    const retry = first.getByRole('button', { name: 'Retry save' });
    await retry.waitFor();
    assert.equal(await fail.isChecked(), false);
    assert.equal(await fields.first().inputValue(), edited);
    assert.equal(await artboards.getByText('Unsaved changes', { exact: true }).count(), 4);

    await retry.click();
    await page.clock.runFor(700);
    await first.getByText('All changes saved', { exact: true }).waitFor();
    assert.deepEqual(await fields.evaluateAll((inputs) => inputs.map((input) => input.value)), [
      edited,
      ...Array(5).fill(initial),
    ]);
    await toolbar.getByRole('button', { name: 'Reset' }).click();
    assert.equal(await fields.first().inputValue(), initial);
    assert.equal(await artboards.getByText('Unsaved changes', { exact: true }).count(), 6);

    await navigate(page, {
      item: 'app-shell',
      tab: 'states',
      block: 'save',
      family: 'soft',
      scheme: 'light',
      vp: '1280',
    });
    const canvas = frame.locator('.wb-artboard .app-shell-main');
    await canvas.waitFor();
    const scrolled = await canvas.evaluate((element) => {
      const bar = element.querySelector('.app-shell-sticky-bar');
      const before = bar.getBoundingClientRect().bottom;
      element.scrollTop = element.scrollHeight;
      return { distance: element.scrollTop, shift: bar.getBoundingClientRect().bottom - before };
    });
    assert.ok(scrolled.distance > 0, 'The desktop canvas needs content to scroll');
    assert.ok(Math.abs(scrolled.shift) <= 1, 'Save actions should stay visible while scrolling');
  },

  'AppShell save completion preserves typing and focus outside the saving artboard': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mount('workbench-v3');
    await navigate(page, { item: 'app-shell', tab: 'states', block: 'save', freeze: '1' });
    const frame = page.locator('[data-wb-block="save"]');
    const boards = frame.locator('.wb-artboard');
    const fields = boards.getByRole('textbox', { name: 'Workspace name' });
    const first = boards.first();
    const second = boards.nth(1);
    await fields.first().waitFor();
    const initial = await fields.first().inputValue();
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));

    await first.getByRole('button', { name: 'Save changes' }).click();
    await fields.nth(1).focus();
    await page.keyboard.press('End');
    await page.keyboard.insertText(' X');
    await page.clock.runFor(750);
    await first.getByText('All changes saved').waitFor();
    assert.ok(await fields.nth(1).evaluate((field) => field.matches(':focus')));
    await page.keyboard.insertText('Y');
    assert.equal(await fields.nth(1).inputValue(), initial + ' XY');
    assert.equal(await fields.first().inputValue(), initial);

    await second.getByRole('button', { name: 'Save changes' }).click();
    const control = frame.getByRole('checkbox', { name: 'Simulate a save failure' });
    await control.focus();
    await page.clock.runFor(750);
    await second.getByText('All changes saved').waitFor();
    assert.ok(await control.evaluate((element) => element.matches(':focus')));

    const third = boards.nth(2);
    await third.getByRole('button', { name: 'Save changes' }).click();
    await page.clock.runFor(750);
    await third.getByText('All changes saved').waitFor();
    assert.ok(await fields.nth(2).evaluate((field) => field.matches(':focus')));
  },

  'AppShell validates the edited workspace alias independently in each artboard': async ({
    page,
    mount,
  }) => {
    await mount('workbench-v3');
    await navigate(page, { item: 'app-shell', tab: 'states', block: 'properties', freeze: '1' });

    const boards = page.locator('[data-wb-block="properties"] .wb-artboard');
    const fields = boards.getByRole('textbox', { name: 'Workspace alias' });
    const first = fields.first();
    await first.waitFor();
    assert.equal(await fields.count(), 6);
    assert.equal(await first.inputValue(), 'Design team!');
    assert.equal(await first.getAttribute('aria-invalid'), 'true');
    for (const value of ['design-team', 'עיצוב-2', 'design team!']) {
      await first.fill(value);
      const invalid = value.includes('!');
      assert.equal(await first.getAttribute('aria-invalid'), invalid ? 'true' : null);
      assert.equal(
        await boards.first().getByText('Invalid', { exact: true }).count(),
        invalid ? 1 : 0,
      );
      assert.equal(
        await first.evaluate(
          (field) =>
            field.ownerDocument.getElementById(field.getAttribute('aria-describedby'))?.textContent,
        ),
        'An alias can contain letters, digits and hyphens.',
      );
      assert.equal(await fields.nth(1).inputValue(), 'Design team!');
      assert.equal(await fields.nth(1).getAttribute('aria-invalid'), 'true');
    }
  },

  'Narrow overlay studies keep readable text on the floating surface': async ({ page, mount }) => {
    await page.setViewportSize({ width: 412, height: 950 });
    await mount('workbench-v3');

    for (const [item, tab, block, selector] of [
      ['app-shell', 'states', 'layout', '.shell-study-layout h3'],
      ['blockquote', 'states', 'overflow', 'blockquote p'],
      ['container', 'compositions', 'document', 'h3'],
    ]) {
      await navigate(page, {
        item,
        block,
        tab,
        family: 'pixel',
        scheme: 'light',
        surface: 'overlay',
        vp: '360',
        scale: '120',
        dir: 'rtl',
        raw: '1',
      });
      const frame = page.locator(`[data-wb-block="${block}"] .wb-artboard`);
      const reading = frame.locator(selector).first();
      await reading.waitFor({ state: 'attached' });
      const { stageWidth, textWidth, contained, painted } = await reading.evaluate((element) => {
        const stage = element.closest('[data-stage-content]').getBoundingClientRect();
        const text = element.getBoundingClientRect();
        const panel = element.closest('.unica-overlay-surface');
        return {
          painted: panel && getComputedStyle(panel).backgroundColor !== 'rgba(0, 0, 0, 0)',
          stageWidth: stage.width,
          textWidth: text.width,
          contained: text.left >= stage.left - 1 && text.right <= stage.right + 1,
        };
      });
      assert.ok(painted, `${item} text has no floating surface over the underlay`);
      assert.ok(textWidth >= stageWidth / 2, `${item} text collapsed to ${textWidth}px`);
      assert.ok(contained, `${item} text extends past its overlay stage`);
    }
  },

  'Workbench v3 StoryFrame controls, actions, and reset synchronize across all 6 themes without header jump':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mount('workbench-v3');
      await navigate(page, { item: 'progress', tab: 'states', block: 'motion' });

      const headerRow = page.locator('.wb-story-header-row').first();
      await headerRow.waitFor();
      const beforeHeight = (await headerRow.boundingBox()).height;

      const activeToggle = page.getByRole('checkbox', { name: 'Active' });
      await activeToggle.click();
      const afterHeight = (await headerRow.boundingBox()).height;
      assert.equal(afterHeight, beforeHeight, 'Toggling Active must not change header height');
      assert.equal(await page.getByText('Transfer paused').count(), 6);

      await activeToggle.click();
      await page.getByRole('button', { name: 'Reach 100%' }).click();
      assert.equal(await page.getByText('All bytes transferred').count(), 6);

      await page.getByRole('button', { name: 'Replay' }).click();
      assert.equal(await page.getByText('Transferring archive').count(), 6);

      // Mutate both frame control and action state right before Reset so Reset proves both restore.
      await activeToggle.click();
      await page.getByRole('button', { name: 'Reach 100%' }).click();
      assert.equal(await activeToggle.isChecked(), false);
      assert.equal(await page.getByText('All bytes transferred').count(), 6);

      await page.getByRole('button', { name: 'Reset' }).click();
      assert.equal(await activeToggle.isChecked(), true);
      assert.equal(await page.getByText('Transferring archive').count(), 6);

      // Button toggles and overflow keep zero ad-hoc harness controls inside artboards.
      await navigate(page, { item: 'button', tab: 'states', block: 'toggles' });
      await page.locator('.wb-story-frame[data-wb-block="toggles"]').waitFor();
      assert.equal(await page.locator('.wb-artboard select').count(), 0);
      await page.getByLabel('Tone').selectOption('danger');
      assert.equal(await page.locator('.wb-artboard').getByText('primary / danger / s').count(), 6);
    },

  'Workbench v3 solo expand/collapse, Escape after checkbox focus, light canvas, and Usage readiness work in Chromium':
    async ({ page, mount }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await mount('workbench-v3');
      await navigate(page, { item: 'button', tab: 'states', scheme: 'light' });

      const canvas = page.locator('.wb-canvas[data-canvas-scheme="light"]');
      await canvas.waitFor();
      const lightBg = await canvas.evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(lightBg, 'rgb(231, 231, 228)');

      // Expand a single artboard inside a case, toggle a StoryFrame checkbox, then Escape collapses solo cleanly.
      const lightFrame = page.locator('.wb-story-frame[data-wb-block="light"]');
      await lightFrame.getByRole('button', { name: 'Expand Frost · Light' }).click();
      await page.waitForFunction(() => window.location.search.includes('solo=frost-light'));
      assert.equal(await page.locator('.wb-artboard').count(), 1);
      assert.equal(
        await page
          .getByRole('group', { name: 'Scheme' })
          .getByRole('link', { name: 'Light' })
          .getAttribute('aria-current'),
        null,
      );

      const pendingCheckbox = page.getByRole('checkbox', { name: 'Pending' });
      await pendingCheckbox.click();
      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () =>
          !window.location.search.includes('solo=') &&
          window.location.search.includes('scheme=light'),
      );
      assert.ok((await page.locator('.wb-story-frame').count()) > 1);

      // Compositions code footer matches the light canvas scheme, and Button form uses real Unica Input.
      await navigate(page, { item: 'button', tab: 'compositions', scheme: 'light' });
      const footer = page.locator('.wb-story-footer').first();
      await footer.waitFor();
      const footerBg = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(footerBg, 'rgb(245, 245, 242)');
      assert.ok(
        (await page.locator('[data-wb-block="form"] .unica-input').count()) >= 3,
        'Button form composition must use real @docouno/unica Input',
      );

      // Compositions code footer returns to the dark surface when dark themes are visible.
      await navigate(page, { item: 'button', tab: 'compositions', scheme: 'both' });
      await page.locator('.wb-canvas[data-canvas-scheme="dark"]').waitFor();
      const darkFooterBg = await page
        .locator('.wb-story-footer')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(darkFooterBg, 'rgb(23, 23, 23)');

      // Button Playground renders only the button subject (no stray Workbench Submit/Reset wrapper buttons).
      await navigate(page, { item: 'button', tab: 'playground', scheme: 'light' });
      await page.locator('[data-wb-tab="playground"]').waitFor();
      await page.locator('.wb-artboard .unica-button').first().waitFor();
      assert.equal(await page.locator('.wb-inspector-form-actions').count(), 0);

      // Usage stays dark under scheme=light, resolves async Markdown to data-wb-ready="1", and omits sentinel "auto".
      await navigate(page, { item: 'button', tab: 'usage', scheme: 'light' });
      await page.locator('[data-wb-tab="usage"]').waitFor();
      await page.locator('#wb-usage-reference').waitFor();
      await page.waitForSelector('html[data-wb-ready="1"]');
      assert.equal(await page.locator('.wb-canvas').getAttribute('data-canvas-scheme'), 'dark');
      const propsTable = page.getByRole('table', { name: 'Public props' });
      const variantRow =
        (await propsTable.getByRole('row', { name: /^variant\b/ }).textContent()) ?? '';
      assert.match(variantRow, /"primary" \| "secondary" \| "ghost"/);
      assert.match(variantRow, /undefined/);
      assert.doesNotMatch(variantRow, /"auto"/);
      const widthRow =
        (await propsTable.getByRole('row', { name: /^width\b/ }).textContent()) ?? '';
      assert.match(widthRow, /"auto" \| "full"/);
    },
};
