import assert from 'node:assert/strict';
import { assertFocused, assertHitTarget, getBox, pressKeys, submitForm } from '../helpers.mjs';

const mountForms = (mount, options) => mount('segmented-control', options);
const group = (page, name) => page.getByRole('radiogroup', { name, exact: true });
const option = (page, name, label) =>
  group(page, name).getByRole('radio', { name: label, exact: true });
const button = (page, name) => page.getByRole('button', { name, exact: true });
const entries = (form) => form.evaluate((node) => [...new FormData(node)]);
const focus = (target) => target.evaluate((node) => node.focus());
const activate = (target) => target.evaluate((node) => node.click());

async function changes(page) {
  const text = await page.getByTestId('log').textContent();
  return text
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function resetSnapshot(form) {
  return form.evaluate((node) => {
    node.reset();
    return {
      data: [...new FormData(node)],
      checked: [...node.querySelectorAll('input:checked')].map((input) => input.value),
      valid: node.checkValidity(),
    };
  });
}

export default {
  'SegmentedControl named choices submit immediately and reset to an absent mount value': async ({
    page,
    mount,
  }) => {
    await mountForms(mount);
    const form = page.getByTestId('local');
    assert.deepEqual(await entries(form), [['answer', 'a']]);
    await option(page, 'Local', 'Beta').click();
    assert.deepEqual(await changes(page), [
      { phase: 'local', next: 'b', data: [['answer', 'b']], checked: ['b'] },
    ]);
    assert.deepEqual(await resetSnapshot(form), {
      data: [['answer', 'a']],
      checked: ['a'],
      valid: true,
    });

    await button(page, 'Remove Alpha').click();
    await option(page, 'Local', 'Empty key').click();
    assert.equal(await option(page, 'Local', 'Empty key').isChecked(), true);
    assert.deepEqual(await submitForm(form, button(page, 'Submit local')), [['answer', '']]);

    const cancelled = await form.evaluate(async (node) => {
      node.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      node.reset();
      node.dispatchEvent(new Event('reset', { bubbles: true }));
      await Promise.resolve();
      return [...new FormData(node)];
    });
    assert.deepEqual(cancelled, [['answer', '']]);
    assert.deepEqual(await resetSnapshot(form), {
      data: [['answer', 'a']],
      checked: [],
      valid: true,
    });
    assert.equal(await group(page, 'Local').getByRole('radio', { checked: true }).count(), 0);
    await button(page, 'Restore options').click();
    assert.equal(await option(page, 'Local', 'Alpha').isChecked(), true);
    await option(page, 'Local', 'Beta').click();
    await button(page, 'Remove Beta').click();
    assert.deepEqual(await entries(form), [['answer', 'b']]);
    assert.deepEqual(
      (await changes(page)).map((change) => change.next),
      ['b', '', 'b'],
    );
  },

  'SegmentedControl controlled refusal preserves checkedness and re-enters the active group from both directions':
    async ({ page, mount }) => {
      await mountForms(mount, { direction: 'rtl' });
      const form = page.getByTestId('controlled');
      const beta = option(page, 'Controlled', 'Beta');
      const empty = option(page, 'Controlled', 'Empty key');
      await focus(button(page, 'Before choice'));
      await pressKeys(page, 'Tab');
      await assertFocused(beta);
      assert.equal((await changes(page)).length, 0);

      await pressKeys(page, 'ArrowLeft');
      await assertFocused(empty);
      await pressKeys(page, 'End');
      assert.deepEqual(await changes(page), [
        { phase: 'proposed', next: '', data: [['controlled', 'a']], checked: ['a'] },
        { phase: 'proposed', next: '', data: [['controlled', 'a']], checked: ['a'] },
      ]);
      assert.equal(await option(page, 'Controlled', 'Alpha').isChecked(), true);
      assert.equal(await empty.isChecked(), false);
      await pressKeys(page, 'Tab');
      await assertFocused(button(page, 'After choice'));
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(beta);
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(button(page, 'Before choice'));

      await button(page, 'Commit unknown').click();
      assert.deepEqual(await entries(form), []);
      await button(page, 'Commit Alpha').click();
      await button(page, 'Accept proposals').click();
      await empty.click();
      assert.deepEqual((await changes(page)).slice(-2), [
        { phase: 'proposed', next: '', data: [['controlled', 'a']], checked: ['a'] },
        { phase: 'accepted', next: '', data: [['controlled', '']], checked: [''] },
      ]);
      assert.deepEqual(await resetSnapshot(form), {
        data: [['controlled', '']],
        checked: [''],
        valid: true,
      });
      await button(page, 'Toggle read only').click();
      await focus(empty);
      await pressKeys(page, 'Home', 'ArrowLeft', 'Space');
      await beta.click();
      assert.deepEqual(await entries(form), [['controlled', '']]);
      assert.equal((await changes(page)).length, 4);
      await button(page, 'Toggle read only').click();
      await button(page, 'Cancel keys').click();
      await focus(beta);
      await pressKeys(page, 'Space', 'ArrowRight');
      assert.deepEqual(await entries(form), [['controlled', '']]);
      assert.equal((await changes(page)).length, 4);
      await beta.click();
      assert.deepEqual(await entries(form), [['controlled', 'b']]);
      assert.deepEqual((await changes(page)).slice(-2), [
        { phase: 'proposed', next: 'b', data: [['controlled', '']], checked: [''] },
        { phase: 'accepted', next: 'b', data: [['controlled', 'b']], checked: ['b'] },
      ]);
    },

  'SegmentedControl settles a controlled commit after a trusted click is cancelled': async ({
    page,
    mount,
  }) => {
    for (const [alreadyChecked, vetoButton] of [
      [false, 'Veto click and commit another option'],
      [true, 'Veto click in form and commit another option'],
      [true, 'Veto click in capture and commit another option'],
      [true, 'Veto click in form capture and commit another option'],
    ]) {
      await mountForms(mount);
      const form = page.getByTestId('controlled');
      const beta = option(page, 'Controlled', 'Beta');
      if (alreadyChecked) {
        await button(page, 'Accept proposals').click();
        await beta.click();
        assert.equal(await beta.isChecked(), true);
      }
      const recorded = await changes(page);
      await button(page, vetoButton).click();
      await beta.click();
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
      assert.deepEqual(await entries(form), [['controlled', '']]);
      assert.equal(await option(page, 'Controlled', 'Empty key').isChecked(), true);
      assert.equal(await beta.isChecked(), false);
      assert.deepEqual(await changes(page), recorded);
    }
  },

  'SegmentedControl keeps disabled and read-only values when click propagation is stopped': async ({
    page,
    mount,
  }) => {
    await mountForms(mount);
    const form = page.getByTestId('controlled');
    const alpha = option(page, 'Controlled', 'Alpha');
    const beta = option(page, 'Controlled', 'Beta');
    await button(page, 'Accept proposals').click();
    await button(page, 'Stop click propagation').click();
    await beta.click();
    await alpha.click({ force: true });
    await activate(alpha);
    assert.deepEqual(await entries(form), [['controlled', 'b']]);
    await button(page, 'Toggle read only').click();
    await option(page, 'Controlled', 'Empty key').click();
    assert.deepEqual(await entries(form), [['controlled', 'b']]);
    assert.equal(await beta.isChecked(), true);
    assert.deepEqual(
      (await changes(page)).map((change) => change.next),
      ['b', 'b'],
    );
  },

  'SegmentedControl controlled proposals settle when input propagation is stopped': async ({
    page,
    mount,
  }) => {
    await mountForms(mount);
    const form = page.getByTestId('controlled');
    const beta = option(page, 'Controlled', 'Beta');
    await button(page, 'Stop input propagation').click();
    await beta.click();
    assert.deepEqual(await entries(form), [['controlled', 'a']]);
    assert.equal(await beta.isChecked(), false);
    assert.deepEqual(await changes(page), [
      { phase: 'proposed', next: 'b', data: [['controlled', 'a']], checked: ['a'] },
    ]);
    await button(page, 'Accept proposals').click();
    await beta.click();
    assert.deepEqual(await entries(form), [['controlled', 'b']]);
    assert.equal(await beta.isChecked(), true);
  },

  'SegmentedControl keeps speculative radio values out of delegated form submission': async ({
    page,
    mount,
  }) => {
    await mountForms(mount);
    const form = page.getByTestId('controlled');
    const beta = option(page, 'Controlled', 'Beta');
    const alpha = option(page, 'Controlled', 'Alpha');
    await button(page, 'Submit from delegated change').click();
    await beta.click();
    assert.deepEqual(await entries(form), [['controlled', 'a']]);
    const rejectedSubmits = (await changes(page)).filter(({ phase }) => phase === 'auto-submit');
    assert.ok(rejectedSubmits.length > 0);
    for (const { data } of rejectedSubmits) {
      assert.deepEqual(data, [['controlled', 'a']]);
    }
    await button(page, 'Accept proposals').click();
    await beta.click();
    assert.deepEqual(await entries(form), [['controlled', 'b']]);
    const acceptedCount = (await changes(page)).length;
    await alpha.click({ force: true });
    await button(page, 'Toggle read only').click();
    await option(page, 'Controlled', 'Empty key').click();
    assert.deepEqual(await entries(form), [['controlled', 'b']]);
    const blockedChanges = await changes(page);
    for (const { phase, data } of blockedChanges.slice(acceptedCount)) {
      assert.equal(phase, 'auto-submit');
      assert.deepEqual(data, [['controlled', 'b']]);
    }

    await button(page, 'Veto click and commit another option').click();
    await option(page, 'Local', 'Beta').click();
    assert.deepEqual(await entries(page.getByTestId('local')), [['answer', 'a']]);
    const recorded = await changes(page);
    for (const { phase, data } of recorded.slice(blockedChanges.length)) {
      assert.equal(phase, 'auto-submit');
      assert.deepEqual(data, [['answer', 'a']]);
    }
    assert.deepEqual(
      recorded
        .filter(({ phase }) => phase !== 'auto-submit')
        .map(({ phase, next }) => [phase, next]),
      [
        ['proposed', 'b'],
        ['proposed', 'b'],
        ['accepted', 'b'],
      ],
    );
  },

  'SegmentedControl settles clicks after a detached mount joins the document or shadow root':
    async ({ page, mount }) => {
      for (const label of ['Mount detached group', 'Mount detached group in shadow']) {
        await mountForms(mount);
        await button(page, label).click();
        const form = page.getByTestId('detached-form');
        assert.deepEqual(await entries(form), [['adopted', 'a']]);
        await option(page, 'Adopted group', 'Empty key').click();
        assert.deepEqual(await entries(form), [['adopted', 'a']]);
        await option(page, 'Adopted group', 'Alpha').click();
        await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
        assert.deepEqual(await entries(form), [['adopted', 'b']]);
        assert.equal(await option(page, 'Adopted group', 'Beta').isChecked(), true);
      }
    },

  'SegmentedControl keeps a native reset when its form moves between DOM roots': async ({
    page,
    mount,
  }) => {
    for (const [inShadow, moveBeforeReset] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ]) {
      await mountForms(mount);
      await button(page, 'Use uncontrolled adopted group').click();
      await button(
        page,
        inShadow ? 'Mount detached group in shadow' : 'Mount detached group',
      ).click();
      const form = page.getByTestId('detached-form');
      const snapshots = await form.evaluate((node, moveBeforeReset) => {
        node.querySelector('input[value="b"]').click();
        if (moveBeforeReset) {
          const movingHost = node.parentElement;
          const document = node.ownerDocument;
          if (node.getRootNode() instanceof ShadowRoot) {
            document.body.append(movingHost);
          } else {
            const mount = document.createElement('div');
            document.body.append(mount);
            mount.attachShadow({ mode: 'open' }).append(movingHost);
          }
        }
        const chosen = new FormData(node).get('adopted');
        node.reset();
        return { chosen, reset: new FormData(node).get('adopted') };
      }, moveBeforeReset);
      assert.deepEqual(snapshots, { chosen: 'b', reset: 'a' });
      await button(page, 'Refresh adopted choices').click();
      assert.deepEqual(await entries(form), [['adopted', 'a']]);
    }
  },

  'SegmentedControl settles completed resets before a subsequent edit, commit, or form move':
    async ({ page, mount }) => {
      await mountForms(mount);
      const local = page.getByTestId('local');
      await option(page, 'Local', 'Beta').click();
      const snapshots = await local.evaluate(async (form) => {
        form.reset();
        form.querySelector('input[value=""]').click();
        const current = [...new FormData(form)];
        await Promise.resolve();
        return { current, after: [...new FormData(form)] };
      });
      assert.deepEqual(snapshots, {
        current: [['answer', '']],
        after: [['answer', '']],
      });

      await option(page, 'Local', 'Beta').click();
      const queued = await local.evaluate(async (form) => {
        form.addEventListener('reset', (event) => event.preventDefault(), { once: true });
        form.reset();
        const cancelled = new FormData(form).get('answer');
        form.reset();
        const applied = new FormData(form).get('answer');
        await Promise.resolve();
        return { cancelled, applied, settled: new FormData(form).get('answer') };
      });
      assert.deepEqual(queued, { cancelled: 'b', applied: 'a', settled: 'a' });

      await button(page, 'Submit from delegated change').click();
      await button(page, 'Reset and refresh local choices').click();
      assert.deepEqual((await changes(page)).at(-1), {
        phase: 'auto-submit',
        next: '',
        data: [['answer', 'a']],
        checked: ['a'],
      });

      const external = option(page, 'External', 'Beta');
      await external.click();
      assert.deepEqual(await entries(local), [
        ['answer', 'a'],
        ['external', 'b'],
      ]);
      await button(page, 'Reset and move external owner').click();
      assert.deepEqual(await entries(page.getByTestId('controlled')), [['controlled', 'a']]);
      assert.equal(await external.isChecked(), false);
    },

  'SegmentedControl preserves reset order through native form reassociation': async ({
    page,
    mount,
  }) => {
    const snapshots = [];
    for (const timing of [
      'before',
      'leave-during',
      'join-during',
      'after',
      'leave-and-return',
      'join-and-return',
    ]) {
      await mountForms(mount);
      const beta = option(page, 'External', 'Beta');
      await beta.click();
      snapshots.push(
        await beta.evaluate(async (input, timing) => {
          const original = input.form;
          const next = input.ownerDocument.getElementById('controlled-answer');
          const reassign = () => {
            original.id = 'old-local-answer';
            next.id = 'local-answer';
          };
          if (timing === 'leave-during' || timing === 'leave-and-return') {
            original.addEventListener('reset', reassign, { once: true });
            original.reset();
          } else if (timing === 'before') {
            reassign();
            next.reset();
            input.click();
          } else if (timing === 'join-during' || timing === 'join-and-return') {
            next.addEventListener('reset', reassign, { once: true });
            next.reset();
          } else {
            next.reset();
            reassign();
          }
          if (timing.endsWith('-and-return')) {
            next.id = 'controlled-answer';
            original.id = 'local-answer';
          }
          const owner = input.form;
          const immediate = new FormData(owner).get('external');
          await Promise.resolve();
          return {
            owner: owner === next ? 'next' : 'original',
            immediate,
            settled: new FormData(owner).get('external'),
          };
        }, timing),
      );
      if (timing === 'join-and-return') {
        await button(page, 'Move external owner').click();
        assert.deepEqual(await entries(page.getByTestId('controlled')), [['controlled', 'a']]);
      }
    }
    assert.deepEqual(snapshots, [
      { owner: 'next', immediate: 'b', settled: 'b' },
      { owner: 'next', immediate: 'b', settled: 'b' },
      { owner: 'next', immediate: null, settled: null },
      { owner: 'next', immediate: 'b', settled: 'b' },
      { owner: 'original', immediate: 'b', settled: 'b' },
      { owner: 'original', immediate: null, settled: null },
    ]);
  },

  'SegmentedControl validation delegates focus, including empty catalogs, and preserves native fieldset rules':
    async ({ page, mount }) => {
      await mountForms(mount);
      const form = page.getByTestId('empty');
      await focus(button(page, 'Before required'));
      await pressKeys(page, 'Tab');
      await assertFocused(option(page, 'Required', 'Beta'));
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(button(page, 'Before required'));
      assert.equal(await form.evaluate((node) => node.checkValidity()), false);
      await assertFocused(button(page, 'Before required'));
      assert.equal(await form.evaluate((node) => node.reportValidity()), false);
      await assertFocused(option(page, 'Required', 'Beta'));
      await pressKeys(page, 'Home');
      assert.deepEqual(await entries(form), [['required', 'b']]);

      await form.evaluate((node) => node.reset());
      await button(page, 'Disable all required options').click();
      assert.equal(await form.evaluate((node) => node.reportValidity()), false);
      await assertFocused(group(page, 'Required'));
      await button(page, 'Clear required options').click();
      assert.equal(await form.evaluate((node) => node.reportValidity()), false);
      await assertFocused(group(page, 'Required'));
      assert.deepEqual(await entries(form), []);

      const fieldset = page.getByTestId('fieldset');
      assert.deepEqual(await entries(fieldset), [
        ['legend', 'a'],
        ['child', 'a'],
      ]);
      assert.equal(await fieldset.evaluate((node) => node.checkValidity()), false);
      await page.emulateMedia({ forcedColors: 'active' });
      const child = group(page, 'Fieldset child');
      assert.equal(await child.evaluate((node) => getComputedStyle(node).outlineStyle), 'dashed');
      assert.equal(
        await group(page, 'Controlled').evaluate((node) => getComputedStyle(node).outlineStyle),
        'solid',
      );
      await button(page, 'Toggle fieldset').click();
      assert.deepEqual(await entries(fieldset), [['legend', 'a']]);
      assert.equal(await fieldset.evaluate((node) => node.checkValidity()), true);
      assert.equal(await child.getAttribute('aria-disabled'), 'true');
      assert.equal(await child.getAttribute('aria-invalid'), null);
      assert.equal(await child.evaluate((node) => getComputedStyle(node).outlineStyle), 'solid');
      assert.equal(
        await child.evaluate((node) => {
          node.style.width = '45px';
          return node.scrollWidth > node.clientWidth;
        }),
        true,
      );
      const legend = option(page, 'Legend', 'Beta');
      await legend.click();
      await focus(legend);
      await pressKeys(page, 'Tab');
      await assertFocused(button(page, 'Remove Alpha'));
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(legend);
      assert.deepEqual(await entries(fieldset), [['legend', 'b']]);
    },

  'SegmentedControl unnamed fields validate, reset, and leave their native form on unmount':
    async ({ page, mount, renderFixture }) => {
      await mountForms(mount);

      const form = page.getByTestId('unnamed');
      const beta = option(page, 'Unnamed', 'Beta');
      const empty = option(page, 'Unnamed', 'Empty key');
      const other = option(page, 'Other unnamed', 'Alpha');
      await focus(button(page, 'Before unnamed'));
      await pressKeys(page, 'Tab');
      await assertFocused(beta);
      await pressKeys(page, 'Tab');
      await assertFocused(other);
      await pressKeys(page, 'Tab');
      await assertFocused(button(page, 'After unnamed'));
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(other);
      await pressKeys(page, 'Shift+Tab');
      await assertFocused(beta);
      await pressKeys(page, 'End');
      assert.equal(await empty.isChecked(), true);
      assert.equal(await form.evaluate((node) => node.checkValidity()), true);
      assert.deepEqual(await entries(form), []);
      await form.evaluate((node) => node.reset());
      assert.equal(await form.evaluate((node) => node.reportValidity()), false);
      await assertFocused(beta);
      assert.equal(await empty.isChecked(), false);

      assert.deepEqual(await beta.evaluate((input) => [input.form?.id, input.name]), [
        'unnamed-answer',
        '',
      ]);
      await button(page, 'Unmount unnamed').click();
      assert.equal(await group(page, 'Unnamed').count(), 0);
      assert.equal(await form.evaluate((node) => node.checkValidity()), true);

      const ssr = await renderFixture('segmented-control');
      const serverPage = await page.context().newPage();
      await serverPage.setContent(ssr);
      const parsed = await serverPage.locator('#unnamed-answer').evaluate((form) => {
        return {
          entries: [...new FormData(form)],
          valid: form.checkValidity(),
          members: Array.from(form.elements, (element) => element.name),
        };
      });
      await serverPage.close();
      assert.deepEqual(parsed.entries, []);
      assert.equal(parsed.valid, false);
      assert.ok(parsed.members.every((name) => name === ''));
    },

  'SegmentedControl preserves SSR radio nodes and form semantics under hydration': async ({
    page,
    mount,
    renderFixture,
  }) => {
    await mount('segmented-hydration');
    const html = await renderFixture('segmented-control');
    const container = page.getByTestId('segmented-hydration-root');
    const before = await container.evaluateHandle((node, markup) => {
      node.innerHTML = markup;
      return node.querySelector('input[data-unica-segmented-option]');
    }, html);
    const local = page.getByTestId('local');
    const unnamed = page.getByTestId('unnamed');
    assert.deepEqual(await entries(local), [['answer', 'a']]);
    assert.deepEqual(await entries(unnamed), []);
    assert.equal(await unnamed.evaluate((node) => node.checkValidity()), false);
    assert.equal(await option(page, 'Local', 'Alpha').isChecked(), true);
    await button(page, 'Hydrate choices').click();
    const live = option(page, 'Unnamed', 'Beta');
    await live.click();
    assert.equal(await live.isChecked(), true);
    assert.equal(await unnamed.evaluate((node) => node.checkValidity()), true);
    assert.deepEqual(await entries(unnamed), []);
    assert.equal(
      await option(page, 'Local', 'Alpha').evaluate((node, original) => node === original, before),
      true,
    );
    assert.equal(await page.getByTestId('segmented-hydration-errors').textContent(), '');
    await before.dispose();
  },

  'SegmentedControl follows explicit form owner changes and recovers focus when an item disappears':
    async ({ page, mount }) => {
      await mountForms(mount);
      const form = page.getByTestId('local');
      const controlled = page.getByTestId('controlled');
      const external = option(page, 'External', 'Beta');
      await external.click();
      assert.deepEqual(await entries(form), [
        ['answer', 'a'],
        ['external', 'b'],
      ]);
      await button(page, 'Move external owner').click();
      assert.deepEqual(await entries(form), [['answer', 'a']]);
      assert.deepEqual(await entries(controlled), [
        ['controlled', 'a'],
        ['external', 'b'],
      ]);
      await form.evaluate((node) => node.reset());
      assert.equal(await external.isChecked(), true);
      await controlled.evaluate((node) => node.reset());
      assert.equal(await external.isChecked(), false);

      const alpha = option(page, 'Local', 'Alpha');
      const beta = option(page, 'Local', 'Beta');
      await focus(alpha);
      await activate(button(page, 'Disable Alpha'));
      await assertFocused(beta);
      assert.equal(await alpha.isChecked(), true);
      await alpha.evaluate((input) => input.closest('label').click());
      assert.equal(await alpha.isChecked(), true);
      assert.deepEqual(await changes(page), []);
      await beta.click();
      await activate(button(page, 'Remove Beta'));
      assert.equal(await group(page, 'Local').getByRole('radio', { checked: true }).count(), 0);
      assert.deepEqual(await entries(form), [['answer', 'b']]);
    },

  'SegmentedControl reveals RTL choices within its rail and preserves geometry and forced-color focus':
    async ({ page, mount }) => {
      await mount('segmented-layout', {
        direction: 'rtl',
        textScale: 120,
        forcedColors: 'active',
        reducedMotion: 'reduce',
      });
      const rail = group(page, 'Overflow');
      const parent = page.getByTestId('scroll-parent');
      const initialScroll = await parent.evaluate((node) => node.scrollLeft);
      assert.equal(await rail.getAttribute('data-unica-segmented-overflow'), '');
      await activate(button(page, 'Set final mode'));
      assert.equal(await parent.evaluate((node) => node.scrollLeft), initialScroll);
      assert.ok(await rail.evaluate((node) => node.scrollLeft < 0));

      const last = option(page, 'Overflow', 'Final mode');
      await focus(last);
      await pressKeys(page, 'Home');
      const first = option(page, 'Overflow', 'First mode');
      await assertFocused(first);
      const bounds = await getBox(rail);
      const firstBox = await getBox(first);
      assert.ok(firstBox.x + firstBox.width <= bounds.x + bounds.width - 2.9);
      assert.equal(
        await first.evaluate((input) => {
          const styles = getComputedStyle(input.nextElementSibling);
          return styles.outlineWidth;
        }),
        '2px',
      );
      assert.equal(
        await last.evaluate((input) => {
          const styles = getComputedStyle(input.nextElementSibling);
          return styles.transitionDuration;
        }),
        '0s',
      );

      for (const [size, height] of [
        ['s', 30],
        ['m', 40],
        ['l', 48],
      ]) {
        assert.equal((await getBox(group(page, `Icons ${size}`))).height, height);
        assert.equal(await option(page, `Icons ${size}`, 'Middle mode').isChecked(), true);
      }
    },

  'SegmentedControl reveals keyboard focus inside a vertically scrolled parent': async ({
    page,
    mount,
  }) => {
    await mount('segmented-layout');
    const parent = page.getByTestId('vertical-parent');
    const first = option(page, 'Vertical choices', 'First mode');
    const last = option(page, 'Vertical choices', 'Final mode');
    await focus(first);
    assert.equal(await parent.evaluate((node) => node.scrollTop), 0);
    await pressKeys(page, 'End');
    await assertFocused(last);
    assert.ok(await parent.evaluate((node) => node.scrollTop > 0));
    const viewport = await getBox(parent);
    const focused = await getBox(last);
    assert.ok(
      focused.y >= viewport.y && focused.y + focused.height <= viewport.y + viewport.height,
    );
  },

  'SegmentedControl preserves manual rail scroll across adjacent rerenders': async ({
    page,
    mount,
  }) => {
    await mount('segmented-layout');
    const rail = group(page, 'Overflow');
    const manualScroll = await rail.evaluate((node) => {
      node.scrollLeft = node.scrollWidth;
      return node.scrollLeft;
    });
    assert.ok(manualScroll > 0);
    await activate(button(page, 'Update adjacent content'));
    assert.equal(await page.getByTestId('updates').textContent(), '1');
    assert.equal(await rail.evaluate((node) => node.scrollLeft), manualScroll);
  },

  'SegmentedControl animates pointer feedback while selection stays atomic': async ({
    page,
    mount,
  }) => {
    await mount('segmented-layout', { theme: 'frost-dark' });
    const first = option(page, 'Text s', 'First mode');
    const middle = option(page, 'Text s', 'Middle mode');
    const paint = (target) =>
      target.evaluate((input) => {
        const plate = input.nextElementSibling;
        const style = getComputedStyle(plate);
        return {
          background: style.backgroundColor,
          veil: style.getPropertyValue('--_segmented-veil-opacity'),
          duration: getComputedStyle(plate, '::before').transitionDuration,
        };
      });
    const selected = await paint(middle);
    const unselected = await paint(first);
    assert.equal(selected.duration, '0.14s');
    await first.hover();
    assert.equal((await paint(first)).veil, '0.06');
    await page.mouse.down();
    assert.equal((await paint(first)).veil, '0.1');
    await page.mouse.move(750, 560);
    await page.mouse.up();
    assert.equal(await middle.isChecked(), true);
    assert.equal(await first.isChecked(), false);
    await focus(middle);
    await pressKeys(page, 'Home');
    assert.equal((await paint(first)).background, selected.background);
    assert.equal((await paint(middle)).background, unselected.background);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal((await paint(first)).duration, '0s');
  },

  'SegmentedControl coarse hit targets expand inside the three-pixel gaps': async ({
    page,
    mount,
  }) => {
    const context = await page
      .context()
      .browser()
      .newContext({ hasTouch: true, viewport: { width: 400, height: 800 } });
    try {
      const touchPage = await context.newPage();
      await mount('segmented-layout');
      await touchPage.goto(page.url());
      for (const [name, firstLabel, middleLabel] of [
        ['Icons s', 'First mode', 'Middle mode'],
        ['Column', 'First mode', 'Middle mode'],
        ['Short labels', 'I', 'J'],
      ]) {
        const rail = group(touchPage, name);
        const first = option(touchPage, name, firstLabel);
        const middle = option(touchPage, name, middleLabel);
        const firstBox = await getBox(first);
        const middleBox = await getBox(middle);
        assert.ok(firstBox.width >= 43.99 && firstBox.height >= 43.99);
        const gap =
          name === 'Column'
            ? middleBox.y - firstBox.y - firstBox.height
            : middleBox.x - firstBox.x - firstBox.width;
        assert.ok(Math.abs(gap - 1) < 0.01);
        await assertHitTarget(first, { x: firstBox.x + 0.5, y: firstBox.y + firstBox.height / 2 });
        await assertHitTarget(middle, {
          x: middleBox.x + middleBox.width - 0.5,
          y: middleBox.y + middleBox.height / 2,
        });
        assert.ok((await getBox(rail)).height >= 47.99);
      }
    } finally {
      await context.close();
    }
  },
};
