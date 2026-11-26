import assert from 'node:assert/strict';
import { assertFocused, pressKeys } from '../helpers.mjs';

const list = (page) => page.getByRole('tablist', { name: 'Views', exact: true });
const tab = (page, name) => list(page).getByRole('tab', { name, exact: true });
const before = (page) => page.getByRole('textbox', { name: 'Before', exact: true });
const after = (page) => page.getByRole('textbox', { name: 'After', exact: true });
const selected = (page) => list(page).getByRole('tab', { selected: true }).textContent();
const proposals = (page) => page.getByTestId('proposals').textContent();
const order = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

async function change(page, options) {
  return page.evaluate(async (patch) => {
    window.tabsProbe.update(patch);
    await Promise.resolve();
    const active = document.activeElement?.shadowRoot?.activeElement ?? document.activeElement;
    return active?.getAttribute('aria-label') ?? active?.id ?? null;
  }, options);
}

async function formData(page) {
  return page.getByTestId('form').evaluate((form) => [...new FormData(form)]);
}

export default {
  'Tabs navigates along its axis, wraps, and distinguishes focus from controlled selection':
    async ({ page, mount }) => {
      await mount('tabs');
      await change(page, { controlled: true, selected: 'A', reject: true, unavailable: ['B'] });
      await before(page).focus();
      await pressKeys(page, 'Tab', 'ArrowRight');
      await assertFocused(tab(page, 'C'));
      assert.equal(await selected(page), 'A');
      assert.equal(await proposals(page), 'C');
      await pressKeys(page, 'End');
      assert.equal(await proposals(page), 'C');

      await change(page, { selected: 'C' });
      assert.equal(await selected(page), 'C');
      await pressKeys(page, 'Enter', 'Space');
      assert.equal(await proposals(page), 'C');

      await change(page, { direction: 'rtl', activation: 'manual', reject: false });
      await pressKeys(page, 'ArrowLeft');
      await assertFocused(tab(page, 'A'));
      assert.equal(await selected(page), 'C');
      await pressKeys(page, 'Space');
      assert.equal(await selected(page), 'A');
      assert.equal(await proposals(page), 'C,A');
      await pressKeys(page, 'ArrowRight', 'Tab', 'Shift+Tab');
      await assertFocused(tab(page, 'A'));

      await change(page, { orientation: 'vertical' });
      await pressKeys(page, 'ArrowRight', 'Shift+ArrowDown', 'Control+End');
      await assertFocused(tab(page, 'A'));
      await pressKeys(page, 'ArrowDown');
      await assertFocused(tab(page, 'C'));
      assert.equal(await selected(page), 'A');
      await pressKeys(page, 'Home');
      await assertFocused(tab(page, 'A'));
      await pressKeys(page, 'End');
      await assertFocused(tab(page, 'C'));
    },

  'Tabs adopts autofocus before the DOM collection is registered': async ({ page, mount }) => {
    await mount('tabs');
    await change(page, {
      controlled: true,
      activation: 'manual',
      order: ['B', 'A', 'C'],
      autoFocus: 'B',
    });
    await assertFocused(tab(page, 'B'));
    assert.equal(await tab(page, 'B').getAttribute('tabindex'), '0');
    assert.equal(await selected(page), 'A');
    await pressKeys(page, 'Tab');
    await assertFocused(after(page));
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(tab(page, 'A'));
    await pressKeys(page, 'ArrowLeft');
    await assertFocused(tab(page, 'B'));
    assert.equal(
      await change(page, { order: ['A', 'C'] }),
      await tab(page, 'A').getAttribute('id'),
    );
    assert.equal(await proposals(page), '');
  },

  'Tabs navigates from the live trigger after a focus handler redirects focus': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    for (const redirectTriggerFocus of ['allow', 'cancel']) {
      await before(page).focus();
      await change(page, { activation: 'manual', redirectTriggerFocus });
      await tab(page, 'A').focus();
      await assertFocused(tab(page, 'B'));
      const stop = redirectTriggerFocus === 'allow' ? 'B' : 'A';
      assert.equal(await list(page).locator('[role="tab"][tabindex="0"]').textContent(), stop);
      await pressKeys(page, 'ArrowRight');
      await assertFocused(tab(page, 'C'));
      assert.equal(await selected(page), 'A');
    }
  },

  'Tabs keeps the live focus after a blur handler redirects focus inside the list or panel':
    async ({ page, mount }) => {
      await mount('tabs');
      await change(page, {
        controlled: true,
        selected: 'A',
        activation: 'manual',
        redirectOnBlur: 'owner',
      });
      await tab(page, 'A').focus();
      await after(page).focus();
      await assertFocused(tab(page, 'B'));
      assert.equal(await tab(page, 'B').getAttribute('tabindex'), '0');

      const draft = page.getByRole('textbox', { name: 'A draft' });
      await draft.focus();
      await assertFocused(draft);
      await after(page).focus();
      await assertFocused(page.getByRole('textbox', { name: 'A fallback' }));
      assert.equal(await change(page, { selected: 'B' }), await tab(page, 'B').getAttribute('id'));
    },

  'Tabs preserves focus redirected by a trigger or field before blur reaches its owner': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    await change(page, {
      controlled: true,
      selected: 'A',
      activation: 'manual',
      mount: 'unmount',
      redirectOnBlur: 'target',
    });
    for (const outside of [true, false]) {
      const leave = () =>
        after(page).evaluate((field, hasDestination) => {
          if (hasDestination) {
            field.focus();
          } else {
            document.activeElement.blur();
          }
        }, outside);

      await tab(page, 'A').focus();
      await leave();
      await assertFocused(tab(page, 'B'));
      assert.equal(await tab(page, 'B').getAttribute('tabindex'), '0');
      assert.equal(
        await change(page, { order: ['A', 'C'] }),
        await tab(page, 'A').getAttribute('id'),
      );
      await change(page, { order: ['A', 'B', 'C'] });

      await page.getByRole('textbox', { name: 'A draft' }).focus();
      await leave();
      await assertFocused(page.getByRole('textbox', { name: 'A fallback' }));
      assert.equal(await change(page, { selected: 'B' }), await tab(page, 'B').getAttribute('id'));
      await change(page, { selected: 'A' });
    }
  },

  'Tabs validates activation after a click handler commits a new collection': async ({
    page,
    mount,
  }) => {
    await mount('tabs-dynamic');
    await page.evaluate(() => window.tabsDynamic({ removeOnAction: 'click' }));
    await tab(page, 'B').click();
    assert.equal(await tab(page, 'B').count(), 0);
    assert.equal(await selected(page), 'A');
    assert.equal(await proposals(page), '');

    await tab(page, 'C').click();
    assert.equal(await selected(page), 'C');
    assert.equal(await proposals(page), 'C');
  },

  'Tabs navigates the new collection after a key handler commits changes': async ({
    page,
    mount,
  }) => {
    await mount('tabs-dynamic');
    await page.evaluate(() => window.tabsDynamic({ removeOnAction: 'keydown' }));
    await tab(page, 'A').focus();
    await pressKeys(page, 'ArrowRight');
    assert.equal(await tab(page, 'B').count(), 0);
    await assertFocused(tab(page, 'C'));
    assert.equal(await selected(page), 'A');
    await pressKeys(page, 'Enter');
    assert.equal(await selected(page), 'C');
    assert.equal(await proposals(page), 'C');
  },

  'Tabs honors actual external focus when blur still names an internal destination': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    await change(page, {
      controlled: true,
      selected: 'A',
      activation: 'manual',
      mount: 'unmount',
      redirectOnBlur: 'outside',
    });
    await tab(page, 'B').focus();
    await tab(page, 'C').evaluate((node) => node.focus());
    await assertFocused(before(page));
    await pressKeys(page, 'Tab');
    await assertFocused(tab(page, 'A'));

    await page.getByRole('textbox', { name: 'A draft' }).focus();
    await page.getByRole('textbox', { name: 'A fallback' }).evaluate((node) => node.focus());
    await assertFocused(before(page));
    await before(page).evaluate((node) => node.blur());
    assert.equal(await change(page, { selected: 'B' }), '');
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
    assert.equal(await selected(page), 'B');
  },

  'Tabs honors explicit panel blur immediately before a controlled switch': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    for (const mountStrategy of ['eager', 'lazy', 'unmount']) {
      await change(page, { controlled: true, selected: 'A', mount: mountStrategy });
      const draft = page.getByRole('textbox', { name: 'A draft' });
      await draft.focus();
      const states = await draft.evaluate(async (input) => {
        input.blur();
        const afterBlur = document.activeElement === document.body;
        window.tabsProbe.update({ selected: 'B' });
        const afterSwitch = document.activeElement === document.body;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return [afterBlur, afterSwitch, document.activeElement === document.body];
      });
      assert.deepEqual(states, [true, true, true], mountStrategy);
      assert.equal(await selected(page), 'B');
    }
  },

  'Tabs honors an ongoing focus departure when a blur handler commits a change': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    const destination = async (outside) =>
      after(page).evaluate(async (field, hasDestination) => {
        if (hasDestination) {
          field.focus();
        } else {
          document.activeElement.blur();
        }
        const expected = hasDestination ? field : document.body;
        const immediate = document.activeElement === expected;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return [immediate, document.activeElement === expected];
      }, outside);

    for (const outside of [true, false]) {
      await change(page, {
        controlled: true,
        selected: 'A',
        order: ['A', 'B', 'C'],
        activation: 'manual',
        commitOnBlur: 'trigger',
      });
      await tab(page, 'B').focus();
      assert.deepEqual(await destination(outside), [true, true]);
      assert.equal(await tab(page, 'B').count(), 0);
      assert.equal(await tab(page, 'A').getAttribute('tabindex'), '0');

      for (const mountStrategy of ['eager', 'lazy', 'unmount']) {
        await change(page, {
          selected: 'A',
          order: ['A', 'B', 'C'],
          mount: mountStrategy,
          commitOnBlur: outside ? 'panel' : 'field',
        });
        await page.getByRole('textbox', { name: 'A draft' }).focus();
        assert.deepEqual(await destination(outside), [true, true], mountStrategy);
        assert.equal(await selected(page), 'B');
      }
    }
  },

  'Tabs honors a native focus transfer before an ancestor blur handler commits': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    for (const outside of [true, false]) {
      for (const part of ['trigger', 'panel']) {
        await change(page, {
          controlled: true,
          selected: 'A',
          order: ['A', 'B', 'C'],
          activation: 'manual',
          mount: 'unmount',
          commitOnBlur: `capture-${part}`,
        });
        const origin =
          part === 'trigger' ? tab(page, 'B') : page.getByRole('textbox', { name: 'A draft' });
        await origin.focus();
        const states = await after(page).evaluate(async (field, hasDestination) => {
          if (hasDestination) {
            field.focus();
          } else {
            document.activeElement.blur();
          }
          const expected = hasDestination ? field : document.body;
          const immediate = document.activeElement === expected;
          await new Promise((resolve) => requestAnimationFrame(resolve));
          return [immediate, document.activeElement === expected];
        }, outside);
        assert.deepEqual(states, [true, true], part);
        if (part === 'trigger') {
          assert.equal(await tab(page, 'B').count(), 0);
        } else {
          assert.equal(await selected(page), 'B');
        }
      }
    }
  },

  'Tabs honors trusted click and Tab during an ancestor blur update': async ({ page, mount }) => {
    await mount('tabs');
    for (const [part, action] of [
      ['trigger', 'click'],
      ['panel', 'click'],
      ['trigger', 'Tab'],
    ]) {
      await change(page, {
        controlled: true,
        selected: 'A',
        order: ['A', 'B', 'C'],
        activation: 'manual',
        mount: 'unmount',
        commitOnBlur: `capture-${part}`,
      });
      const origin =
        part === 'trigger' ? tab(page, 'B') : page.getByRole('textbox', { name: 'A draft' });
      await origin.focus();
      if (action === 'click') {
        await after(page).click();
      } else {
        await pressKeys(page, 'Tab');
      }
      await assertFocused(after(page));
      if (part === 'trigger') {
        assert.equal(await tab(page, 'B').count(), 0);
      } else {
        assert.equal(await selected(page), 'B');
      }
    }
  },

  'Tabs honors a surviving internal destination and recovers if the destination disappears':
    async ({ page, mount }) => {
      await mount('tabs');
      for (const activation of ['manual', 'automatic']) {
        await change(page, {
          controlled: true,
          selected: 'A',
          order: ['A', 'B', 'C'],
          activation,
          commitOnBlur: 'trigger',
        });
        await tab(page, 'B').focus();
        await pressKeys(page, 'ArrowRight');
        assert.equal(await tab(page, 'B').count(), 0);
        await assertFocused(tab(page, 'C'));
        assert.equal(await selected(page), activation === 'manual' ? 'A' : 'C');
        assert.equal(await proposals(page), activation === 'manual' ? '' : 'C');
      }
      await change(page, {
        selected: 'A',
        order: ['A', 'B', 'C'],
        activation: 'manual',
        removeDestinationOnBlur: true,
      });
      await tab(page, 'B').focus();
      await pressKeys(page, 'ArrowRight');
      await assertFocused(tab(page, 'A'));
      assert.equal(await selected(page), 'A');
      assert.equal(await tab(page, 'C').count(), 0);

      await change(page, { order: ['A', 'B'], commitOnBlur: 'capture-panel' });
      await page.getByRole('textbox', { name: 'A draft' }).focus();
      await page.getByRole('textbox', { name: 'A fallback' }).evaluate((field) => field.focus());
      await assertFocused(tab(page, 'B'));
      assert.equal(await selected(page), 'B');
    },

  'Tabs honors focus transferred into a shadow host without its own box': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    for (const [mode, part] of [
      ['open', 'trigger'],
      ['open', 'panel'],
      ['closed', 'trigger'],
      ['closed', 'panel'],
    ]) {
      for (const hostState of ['boxless', 'hide', 'hide-then-blur']) {
        await change(page, {
          controlled: true,
          selected: 'A',
          order: ['A', 'B', 'C'],
          activation: 'manual',
          mount: 'unmount',
          commitOnBlur: `capture-${part}`,
        });
        const origin =
          part === 'trigger' ? tab(page, 'B') : page.getByRole('textbox', { name: 'A draft' });
        await origin.focus();
        const result = await page.evaluate(
          async ({ shadowMode, state }) => {
            const host = document.createElement('div');
            if (state === 'boxless') {
              host.style.display = 'contents';
              host.style.visibility = 'hidden';
            }
            const root = host.attachShadow({ mode: shadowMode });
            const input = document.createElement('input');
            input.style.visibility = 'visible';
            if (state !== 'boxless') {
              input.addEventListener(
                'focusin',
                () => {
                  host.style.visibility = 'hidden';
                },
                { once: true },
              );
            }
            root.append(input);
            document.body.append(host);
            input.focus();
            const immediate = root.activeElement === input;
            await Promise.resolve();
            if (state === 'hide-then-blur') {
              input.blur();
            }
            await new Promise((resolve) => requestAnimationFrame(resolve));
            const focused =
              state === 'hide-then-blur'
                ? document.activeElement === document.body
                : root.activeElement === input;
            host.remove();
            return [immediate, focused];
          },
          { shadowMode: mode, state: hostState },
        );
        assert.deepEqual(result, [true, true], `${mode} ${part} ${hostState}`);
      }
    }
  },

  'Tabs recovers when a pending destination no longer accepts focus': async ({ page, mount }) => {
    for (const [scope, part] of [
      ['tabs', 'trigger'],
      ['tabs', 'panel'],
      ['tabs-dynamic', 'trigger'],
      ['tabs-dynamic', 'panel'],
    ]) {
      await mount(scope);
      if (scope === 'tabs') {
        await change(page, {
          controlled: true,
          selected: 'A',
          order: ['A', 'B', 'C'],
          activation: 'manual',
          mount: 'unmount',
          commitOnBlur: `capture-${part}`,
        });
      } else {
        await page.evaluate(
          (kind) =>
            window.tabsDynamic({
              removeOnAction: kind === 'trigger' ? 'blur' : 'panel-blur',
            }),
          part,
        );
      }
      const origin =
        part === 'trigger' ? tab(page, 'B') : page.getByRole('textbox', { name: 'A draft' });
      await origin.focus();
      const recovered = await origin.evaluate(async (source) => {
        const destination = document.createElement('div');
        destination.tabIndex = -1;
        destination.textContent = 'Destination';
        document.body.append(destination);
        source.addEventListener('blur', () => destination.removeAttribute('tabindex'), {
          once: true,
        });
        destination.focus();
        await Promise.resolve();
        const afterDispatch = document.activeElement?.id;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const beforeFrame = document.activeElement?.id;
        destination.remove();
        return [afterDispatch, beforeFrame];
      });
      const id = await tab(page, part === 'trigger' ? 'A' : 'B').getAttribute('id');
      assert.deepEqual(recovered, [id, id], part);
    }
  },

  'Tabs recovers when the browser releases a hidden focusable div': async ({ page, mount }) => {
    await mount('tabs');
    for (const part of ['trigger', 'panel']) {
      await change(page, {
        controlled: true,
        selected: 'A',
        order: ['A', 'B', 'C'],
        activation: 'manual',
        mount: 'unmount',
        commitOnBlur: `capture-${part}`,
      });
      const origin =
        part === 'trigger' ? tab(page, 'B') : page.getByRole('textbox', { name: 'A draft' });
      await origin.focus();
      const result = await page.evaluate(async () => {
        const destination = document.createElement('div');
        destination.tabIndex = -1;
        destination.textContent = 'Destination';
        document.body.append(destination);
        let received = false;
        destination.addEventListener(
          'focusin',
          () => {
            received = true;
            destination.style.visibility = 'hidden';
          },
          { once: true },
        );
        destination.focus();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const focused = document.activeElement?.id;
        destination.remove();
        return [received, focused];
      });
      const id = await tab(page, part === 'trigger' ? 'A' : 'B').getAttribute('id');
      assert.deepEqual(result, [true, id], part);
    }
  },

  'Tabs recovers if the focus recipient disappears or becomes unavailable before a frame': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    for (const mutation of [
      'remove',
      'hide',
      'hide-parent',
      'inert',
      'disable',
      'visibility',
      'visibility-parent',
      'visibility-override',
      'content-visibility',
      'details',
      'shadow-display',
      'blur',
    ]) {
      for (const part of ['trigger', 'panel']) {
        await change(page, {
          controlled: true,
          selected: 'A',
          order: ['A', 'B', 'C'],
          activation: 'manual',
          mount: 'unmount',
          commitOnBlur: `capture-${part}`,
        });
        const origin =
          part === 'trigger' ? tab(page, 'B') : page.getByRole('textbox', { name: 'A draft' });
        await origin.focus();
        const result = await page.evaluate(async (change) => {
          const container = document.createElement(change === 'details' ? 'details' : 'div');
          if (container instanceof HTMLDetailsElement) {
            container.open = true;
            const summary = document.createElement('summary');
            summary.textContent = 'Details';
            container.append(summary);
          }
          const input = document.createElement('input');
          input.id = 'recipient';
          if (change === 'visibility-override') {
            input.style.visibility = 'visible';
          }
          const root =
            change === 'shadow-display' ? container.attachShadow({ mode: 'open' }) : container;
          root.append(input);
          document.body.append(container);
          input.addEventListener(
            'focusin',
            () => {
              switch (change) {
                case 'remove':
                  input.remove();
                  break;
                case 'hide':
                  input.hidden = true;
                  break;
                case 'hide-parent':
                  container.hidden = true;
                  break;
                case 'inert':
                  container.inert = true;
                  break;
                case 'disable':
                  input.disabled = true;
                  break;
                case 'visibility':
                  input.style.visibility = 'hidden';
                  break;
                case 'visibility-parent':
                case 'visibility-override':
                  container.style.visibility = 'hidden';
                  break;
                case 'content-visibility':
                  container.style.contentVisibility = 'hidden';
                  break;
                case 'details':
                  container.open = false;
                  break;
                case 'shadow-display':
                  input.style.display = 'none';
                  break;
                case 'blur':
                  input.blur();
                  break;
              }
            },
            { once: true },
          );
          input.focus();
          await Promise.resolve();
          const readId = () =>
            document.activeElement?.shadowRoot?.activeElement?.id ?? document.activeElement?.id;
          const microtask = readId();
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const beforeFrame = readId();
          container.remove();
          return [microtask, beforeFrame];
        }, mutation);
        const id =
          mutation === 'blur'
            ? ''
            : mutation === 'visibility-override'
              ? 'recipient'
              : await tab(page, part === 'trigger' ? 'A' : 'B').getAttribute('id');
        assert.deepEqual(result, [id, id], `${mutation} ${part}`);
      }
    }
    await mount('tabs-dynamic');
    await page.evaluate(() =>
      window.tabsDynamic({
        removeOnAction: 'blur',
        removeDestinationOnFocus: true,
      }),
    );
    await tab(page, 'B').focus();
    await pressKeys(page, 'ArrowRight');
    assert.equal(await tab(page, 'C').count(), 0);
    assert.equal(await tab(page, 'B').count(), 0);
    await assertFocused(tab(page, 'A'));
  },

  'Tabs honors a transfer inside the shadow root that hosts React': async ({ page, mount }) => {
    await mount('tabs-shadow');
    for (const mode of ['open', 'closed']) {
      const result = await page.evaluate(
        (shadowMode) => window.tabsShadowProbe.transfer(shadowMode),
        mode,
      );
      assert.deepEqual(result, ['C', 'C', false], mode);
    }
  },

  'Tabs honors explicit blur when a child removes the focused trigger or panel': async ({
    page,
    mount,
  }) => {
    for (const part of ['trigger', 'panel']) {
      await mount('tabs-dynamic');
      await page.evaluate(
        (kind) =>
          window.tabsDynamic({
            removeOnAction: kind === 'trigger' ? 'blur' : 'panel-blur',
          }),
        part,
      );
      const origin =
        part === 'trigger' ? tab(page, 'B') : page.getByRole('textbox', { name: 'A draft' });
      await origin.focus();
      const states = await origin.evaluate(async (element) => {
        element.blur();
        const immediate = document.activeElement === document.body;
        await Promise.resolve();
        const microtask = document.activeElement === document.body;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return [immediate, microtask, document.activeElement === document.body];
      });
      assert.deepEqual(states, [true, true, true], part);
      assert.equal(await tab(page, part === 'trigger' ? 'B' : 'A').count(), 0);
      assert.equal(await selected(page), part === 'trigger' ? 'A' : 'B');
    }
  },

  'Tabs honors explicit blur when a child disables the focused trigger': async ({
    page,
    mount,
  }) => {
    await mount('tabs-dynamic');
    await page.evaluate(() => window.tabsDynamic({ disableOnBlur: true }));
    const origin = tab(page, 'B');
    await origin.focus();
    const states = await origin.evaluate(async (element) => {
      element.blur();
      const immediate = document.activeElement === document.body;
      await Promise.resolve();
      const microtask = document.activeElement === document.body;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return [immediate, microtask, document.activeElement === document.body];
    });
    assert.deepEqual(states, [true, true, true]);
    assert.equal(await origin.isDisabled(), true);
    assert.equal(await selected(page), 'A');
  },

  'Tabs keeps an origin restored by an ancestor blur capture': async ({ page, mount }) => {
    await mount('tabs');
    await change(page, { controlled: true, selected: 'A', returnOnBlurCapture: true });
    const moveAway = () => after(page).evaluate((field) => field.focus());

    await tab(page, 'B').focus();
    await moveAway();
    await assertFocused(tab(page, 'B'));
    assert.equal(
      await change(page, { order: ['A', 'C'] }),
      await tab(page, 'A').getAttribute('id'),
    );
    await change(page, { order: ['A', 'B', 'C'] });

    const draft = page.getByRole('textbox', { name: 'A draft' });
    await draft.focus();
    await moveAway();
    await assertFocused(draft);
    assert.equal(await change(page, { selected: 'B' }), await tab(page, 'B').getAttribute('id'));
  },

  'Tabs repairs a lost trigger and panel before the next frame while honoring external focus':
    async ({ page, mount }) => {
      await mount('tabs');
      await change(page, { activation: 'manual' });
      await before(page).focus();
      await pressKeys(page, 'Tab', 'ArrowRight');
      await assertFocused(tab(page, 'B'));
      assert.equal(
        await change(page, { unavailable: ['B'] }),
        await tab(page, 'A').getAttribute('id'),
      );
      assert.equal(await selected(page), 'A');
      await change(page, { unavailable: [] });
      await pressKeys(page, 'ArrowRight');
      assert.equal(await change(page, { replacement: 1 }), await tab(page, 'B').getAttribute('id'));
      assert.equal(
        await change(page, { order: ['A', 'C'] }),
        await tab(page, 'A').getAttribute('id'),
      );
      await pressKeys(page, 'ArrowRight');
      await assertFocused(tab(page, 'C'));
      assert.equal(await proposals(page), '');

      await change(page, {
        controlled: true,
        selected: 'A',
        mount: 'unmount',
        order: ['A', 'B', 'C'],
      });
      await page.getByRole('textbox', { name: 'A draft' }).focus();
      assert.equal(await change(page, { selected: 'B' }), await tab(page, 'B').getAttribute('id'));
      await after(page).focus();
      assert.equal(await change(page, { selected: 'A' }), 'After');
      await page.getByRole('textbox', { name: 'A draft' }).focus();
      assert.equal(await change(page, { selected: 'B', focusOutside: true }), 'shadow-target');
      await page.getByRole('textbox', { name: 'B draft' }).focus();
      assert.equal(
        await change(page, { selected: 'C', order: ['C', 'A'], focusOutside: false }),
        await tab(page, 'C').getAttribute('id'),
      );
    },

  'Tabs waits for DOM publication after local removal, replacement, or autofocus': async ({
    page,
    mount,
  }) => {
    await mount('tabs-dynamic');
    const update = (patch) =>
      page.evaluate(async (patch) => {
        window.tabsDynamic(patch);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }, patch);
    await before(page).focus();
    await pressKeys(page, 'Tab', 'ArrowRight');
    await assertFocused(tab(page, 'B'));
    const original = await tab(page, 'B').elementHandle();
    await update({ order: ['C', 'A', 'B'] });
    assert.ok(await tab(page, 'B').evaluate((node, original) => node === original, original));
    await assertFocused(tab(page, 'B'));

    await update({ order: ['A', 'C'] });
    await assertFocused(tab(page, 'A'));
    await update({ order: ['A', 'B', 'C'] });
    await pressKeys(page, 'ArrowRight');
    await assertFocused(tab(page, 'B'));
    await update({ replacement: 1, disabled: true });
    await assertFocused(tab(page, 'A'));

    await update({ replacement: 2, disabled: false, autoFocus: true });
    await assertFocused(tab(page, 'B'));
    assert.equal(await tab(page, 'B').getAttribute('tabindex'), '0');
    assert.equal(await selected(page), 'A');
    await pressKeys(page, 'Tab');
    await assertFocused(after(page));

    await tab(page, 'B').focus();
    await update({ order: ['A', 'C'], autoFocus: false, moveFocusOutside: true });
    await assertFocused(before(page));
  },

  'Tabs adopts live trigger and panel focus during browser hydration': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('tabs');
    for (const source of ['trigger', 'draft']) {
      await mount('tabs-hydration');
      const host = page.getByTestId('tabs-hydration-root');
      await host.evaluate((node, html) => {
        node.innerHTML = html;
      }, html);
      const origin =
        source === 'trigger' ? tab(page, 'B') : page.getByRole('textbox', { name: 'A draft' });
      const original = await origin.elementHandle();
      if (source === 'draft') {
        await origin.fill('Typed before hydration');
      }
      await origin.focus();
      await page.getByRole('button', { name: 'Hydrate tabs' }).evaluate((node) => node.click());
      await page.waitForFunction(() => window.tabsProbe !== undefined);
      assert.equal(await page.getByTestId('tabs-hydration-errors').textContent(), '');
      assert.ok(await origin.evaluate((node, original) => node === original, original));
      await assertFocused(origin);
      if (source === 'trigger') {
        assert.equal(await origin.getAttribute('tabindex'), '0');
        assert.equal(await selected(page), 'A');
        assert.equal(
          await change(page, { order: ['A', 'C'] }),
          await tab(page, 'A').getAttribute('id'),
        );
      } else {
        assert.equal(await origin.inputValue(), 'Typed before hydration');
        assert.equal(
          await change(page, { order: ['B', 'C'] }),
          await tab(page, 'B').getAttribute('id'),
        );
      }
    }
  },

  'Tabs honors canceled panel focus replay while hydrating': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('tabs');
    await mount('tabs-hydration');
    const host = page.getByTestId('tabs-hydration-root');
    await host.evaluate((node, html) => {
      node.innerHTML = html;
      node.dataset.focusDuringHydration = '';
      node.dataset.cancelPanelFocus = 'A';
    }, html);
    await page.getByRole('button', { name: 'Hydrate tabs' }).evaluate((node) => node.click());
    await host.locator('[role="tabpanel"][data-focus-canceled]').waitFor();
    await assertFocused(page.getByRole('textbox', { name: 'A draft' }));
    assert.equal(await page.getByTestId('tabs-hydration-errors').textContent(), '');
    const clear = await page.evaluate(async () => {
      window.tabsProbe.update({ order: ['B', 'C'] });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return document.activeElement === document.body;
    });
    assert.equal(clear, true);
    assert.equal(await selected(page), 'B');
  },

  'Tabs keeps a newer panel focus during an older canceled capture': async ({ page, mount }) => {
    await mount('tabs');
    await change(page, { controlled: true, selected: 'A', redirectFocus: 'cancel-draft' });
    await page.getByRole('textbox', { name: 'A draft' }).focus();
    await assertFocused(page.getByRole('textbox', { name: 'A fallback' }));
    assert.equal(await change(page, { selected: 'B' }), await tab(page, 'B').getAttribute('id'));
  },

  'Tabs keeps a newer canceled panel focus during an older allowed capture': async ({
    page,
    mount,
  }) => {
    await mount('tabs');
    await change(page, {
      controlled: true,
      selected: 'A',
      mount: 'unmount',
      redirectFocus: 'cancel-fallback',
    });
    await page.getByRole('textbox', { name: 'A draft' }).focus();
    await assertFocused(page.getByRole('textbox', { name: 'A fallback' }));
    assert.equal(await change(page, { selected: 'B' }), '');
    assert.equal(await page.evaluate(() => document.activeElement === document.body), true);
    assert.equal(await selected(page), 'B');
  },

  'Tabs recovers focus within a closed shadow root before the next frame': async ({
    page,
    mount,
  }) => {
    await mount('tabs-shadow');
    const result = await page.evaluate(async () => {
      window.tabsShadowProbe.focusDraft();
      const before = window.tabsShadowProbe.active();
      window.tabsShadowProbe.switchView();
      const immediate = window.tabsShadowProbe.active();
      await Promise.resolve();
      const microtask = window.tabsShadowProbe.active();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return [before, immediate, microtask, window.tabsShadowProbe.active()];
    });
    assert.deepEqual(result, ['A draft', 'B', 'B', 'B']);
  },

  'Tabs preserves panel shells and native form semantics for eager, lazy, and unmount content':
    async ({ page, mount }) => {
      await mount('tabs');
      await change(page, { mount: 'lazy', lastMount: 'unmount', nested: true });
      const a = tab(page, 'A');
      const b = tab(page, 'B');
      const c = tab(page, 'C');
      const panelIds = await list(page)
        .getByRole('tab')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-controls')));
      assert.deepEqual(await formData(page), [['A', 'Draft A']]);
      const field = page.getByRole('textbox', { name: 'A draft' });
      await field.fill('');
      const nested = page.getByRole('tablist', { name: 'Nested views' });
      const nestedField = page.getByRole('textbox', { name: 'Nested draft' });
      await nestedField.fill('Saved nested draft');
      await b.click();
      assert.deepEqual(await formData(page), [
        ['A', ''],
        ['B', 'Draft B'],
      ]);
      assert.equal(await page.getByTestId('form').evaluate((form) => form.checkValidity()), false);

      await c.click();
      await page.getByRole('textbox', { name: 'C draft' }).fill('Unsaved');
      await a.click();
      assert.equal(await nested.getByRole('tab', { selected: true }).textContent(), 'Nested C');
      assert.equal(await nestedField.inputValue(), 'Saved nested draft');
      await c.click();
      assert.equal(await page.getByRole('textbox', { name: 'C draft' }).inputValue(), 'Draft C');
      await page.getByTestId('form').evaluate((form) => form.reset());
      assert.equal(await selected(page), 'C');
      assert.deepEqual(await formData(page), [
        ['A', 'Draft A'],
        ['B', 'Draft B'],
        ['C', 'Draft C'],
      ]);
      await pressKeys(page, 'Enter', 'Space');
      assert.equal(await page.getByTestId('submits').textContent(), '0');

      assert.deepEqual(
        await list(page)
          .getByRole('tab')
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-controls'))),
        panelIds,
      );
      for (const [index, id] of panelIds.entries()) {
        assert.equal(
          await page.evaluate((id) => document.getElementById(id).hidden, id),
          index !== 2,
        );
      }
    },

  'Tabs has no stray Tab stop when the overflowing strip or its fieldset is unavailable': async ({
    page,
    mount,
  }) => {
    await mount('tabs', { theme: 'pixel-dark', reducedMotion: 'reduce' });
    await change(page, { long: true, order: order.slice(0, 7), width: 300, unavailable: order });
    const forward = page.getByRole('button', { name: 'More views' });
    assert.equal(await forward.getAttribute('tabindex'), '-1');
    await before(page).focus();
    await pressKeys(page, 'Tab');
    await assertFocused(after(page));
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(before(page));

    await change(page, { unavailable: [], fieldsetDisabled: true });
    assert.match(await selected(page), /^A /);
    await pressKeys(page, 'Tab');
    await assertFocused(after(page));
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(before(page));
    assert.deepEqual(
      await formData(page),
      order.slice(0, 7).map((key) => [key, `Draft ${key}`]),
    );
    await change(page, { fieldsetDisabled: false });
    await pressKeys(page, 'Tab');
    await assertFocused(list(page).getByRole('tab', { selected: true }));
    await pressKeys(page, 'Tab');
    await assertFocused(after(page));

    await change(page, { fieldsetDisabled: true, inLegend: true });
    await before(page).focus();
    await pressKeys(page, 'Tab');
    await assertFocused(list(page).getByRole('tab', { selected: true }));
    await pressKeys(page, 'ArrowRight');
    assert.match(await selected(page), /^B /);
  },

  'Tabs keeps the selected label neutral and uses a separate Pixel or system selection rule':
    async ({ page, mount }) => {
      await mount('tabs', { theme: 'pixel-dark' });
      await change(page, { long: true, width: 480, unavailable: ['C'] });
      const a = list(page).getByRole('tab', { selected: true });
      const b = list(page).getByRole('tab', { name: /^B / });
      const c = list(page).getByRole('tab', { name: /^C / });
      const color = (locator) => locator.evaluate((node) => getComputedStyle(node).color);
      const readToken = (name) =>
        a.evaluate((node, token) => {
          const probe = document.createElement('span');
          probe.style.color = `var(${token})`;
          node.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        }, name);
      assert.equal(await color(a), await readToken('--fg-primary'));
      assert.equal(await color(a.locator('svg')), await readToken('--fg-primary'));
      assert.equal(await color(b), await readToken('--fg-muted'));
      assert.equal(await color(c), await readToken('--fg-disabled'));
      await b.hover();
      assert.equal(await color(b), await readToken('--fg-primary'));
      const marker = () =>
        a.evaluate((node) => {
          const style = getComputedStyle(node, '::after');
          return [style.backgroundColor, style.height, style.borderRadius];
        });
      assert.deepEqual(await marker(), [await readToken('--accent-signal'), '2px', '0px']);

      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
      await before(page).focus();
      await pressKeys(page, 'Tab');
      await assertFocused(a);
      const forced = await a.evaluate((node) => {
        const style = getComputedStyle(node);
        return [
          style.outlineColor,
          style.outlineWidth,
          style.outlineOffset,
          style.transitionDuration,
        ];
      });
      assert.deepEqual(forced, [(await marker())[0], '2px', '2px', '0s']);
      assert.equal(await list(page).evaluate((node) => getComputedStyle(node).maskImage), 'none');
    },

  'Tabs replaces a real fade with a straight edge in forced and increased contrast': async ({
    page,
    mount,
  }) => {
    await mount('tabs', { theme: 'frost-light' });
    await change(page, { width: 300, order, long: true });
    const mask = () => list(page).evaluate((node) => getComputedStyle(node).maskImage);
    assert.match(await mask(), /linear-gradient/u);
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await mask(), 'none');
    await page.emulateMedia({ forcedColors: 'none', contrast: 'more' });
    assert.equal(await mask(), 'none');
    await page.emulateMedia({ contrast: 'no-preference' });
    assert.match(await mask(), /linear-gradient/u);
  },

  'Tabs applies list availability and accessibility to its overflow controls': async ({
    page,
    mount,
  }) => {
    await mount('tabs', { reducedMotion: 'reduce' });
    await change(page, { order, long: true, width: 300 });
    const arrow = page.locator('button[aria-label="More views"]');
    const accessibleArrow = page.getByRole('button', { name: 'More views' });
    const viewport = page.locator('[role="tablist"]');
    const session = await page.context().newCDPSession(page);
    const arrowInAccessibilityTree = async () => {
      const { nodes } = await session.send('Accessibility.getFullAXTree');
      return nodes.some(
        (node) =>
          !node.ignored && node.role?.value === 'button' && node.name?.value === 'More views',
      );
    };
    await accessibleArrow.waitFor();
    const position = await arrow.boundingBox();
    assert.ok(position);
    assert.equal(await arrowInAccessibilityTree(), true);
    await change(page, { listInert: true });
    assert.equal(await arrowInAccessibilityTree(), false);
    await page.mouse.click(position.x + position.width / 2, position.y + position.height / 2);
    assert.equal(await viewport.evaluate((node) => node.scrollLeft), 0);
    await change(page, { listInert: false, listAriaHidden: true });
    assert.equal(await arrowInAccessibilityTree(), false);
    assert.equal(await arrow.isVisible(), true);
    await change(page, { listAriaHidden: false });
    await accessibleArrow.click();
    assert.ok(await viewport.evaluate((node) => node.scrollLeft > 0));
  },

  'Tabs scrolls and reveals inside a tight RTL strip in Pixel and Frost without moving the page':
    async ({ page, mount }) => {
      for (const theme of ['pixel-dark', 'frost-dark']) {
        await mount('tabs', {
          theme,
          direction: 'rtl',
          textScale: 120,
          surface: 'overlay',
          reducedMotion: 'reduce',
        });
        await change(page, { order, long: true, width: 320, nullAdapter: true });
        const more = page.getByRole('button', { name: 'More views' });
        const previous = page.getByRole('button', { name: 'Previous views' });
        const mask = await list(page).evaluate((node) => getComputedStyle(node).maskImage);
        assert.equal(mask.includes('linear-gradient'), theme === 'frost-dark');
        assert.equal(
          await more.locator('svg path').getAttribute('transform'),
          'rotate(90 128 128)',
        );
        await more.click();
        const browsed = await list(page).evaluate((node) => node.scrollLeft);
        assert.ok(browsed < 0);
        assert.match(await selected(page), /^A /);
        await previous.click();
        assert.equal(await list(page).evaluate((node) => node.scrollLeft), 0);

        await before(page).focus();
        await pressKeys(page, 'Tab');
        const scrollBefore = await page.evaluate(() => [scrollX, scrollY]);
        await pressKeys(page, 'End');
        await assertFocused(tab(page, 'Search views'));
        assert.equal(await more.count(), 0);
        const lastEdge = await tab(page, 'Search views').evaluate((node) => {
          const list = node.closest('[role="tablist"]');
          const viewport = list.getBoundingClientRect();
          const bounds = node.getBoundingClientRect();
          return {
            gap: bounds.left - viewport.left,
            scroll: list.scrollLeft,
            width: list.scrollWidth,
            client: list.clientWidth,
          };
        });
        assert.ok(lastEdge.gap >= 3.5, `${theme} last edge: ${JSON.stringify(lastEdge)}`);
        assert.deepEqual(await page.evaluate(() => [scrollX, scrollY]), scrollBefore);
        await pressKeys(page, 'Home');
        assert.equal(await previous.count(), 0);
        assert.match(await selected(page), /^A /);
      }
    },

  'Tabs hides an open overflow hint while browsing and selects on the first touch': async ({
    page,
    mount,
  }) => {
    await mount('tabs', { reducedMotion: 'reduce' });
    await change(page, { order, long: true, width: 320 });
    const search = tab(page, 'Search views');
    await before(page).focus();
    await pressKeys(page, 'Tab', 'End');
    const hint = page.locator('[role="tooltip"]:popover-open', { hasText: 'Search views' });
    await hint.waitFor();
    const previous = page.getByRole('button', { name: 'Previous views' });
    await previous.click();
    await hint.waitFor({ state: 'hidden' });
    assert.equal(await search.getAttribute('aria-selected'), 'true');
    await change(page, { width: 360 });
    assert.equal(await search.getAttribute('aria-selected'), 'true');

    await before(page).focus();
    await pressKeys(page, 'Tab', 'Home');
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    const forward = page.getByRole('button', { name: 'More views' });
    assert.ok((await forward.boundingBox()).width >= 44);
    await pressKeys(page, 'End');
    const first = list(page).getByRole('tab', { name: /^A / });
    await pressKeys(page, 'Home');
    const second = list(page).getByRole('tab', { name: /^B / });
    await second.focus();
    await before(page).focus();
    const box = await second.boundingBox();
    assert.ok(box);
    const touchPoints = [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await second.getAttribute('aria-selected'), 'true');
    assert.equal(await first.getAttribute('aria-selected'), 'false');
    assert.equal(await page.locator('[role="tooltip"]:popover-open').count(), 0);
  },

  'Tabs reveals both sides of a wide Equal tab and its focus ring on a narrow strip': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    for (const [theme, direction, textScale, width] of [
      ['soft-dark', 'ltr', 100, 200],
      ['frost-dark', 'rtl', 120, 230],
    ]) {
      await mount('tabs', { theme, direction, textScale, reducedMotion: 'reduce' });
      await change(page, { long: true, order: ['A', 'D', 'G', 'H'], width, distribution: 'equal' });
      await before(page).focus();
      await pressKeys(page, 'Tab', direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      const counted = list(page).getByRole('tab', { name: /^D .*104 reviews/u, selected: true });
      await assertFocused(counted);
      const geometry = await counted.evaluate((node) => {
        const cell = node.getBoundingClientRect();
        const rail = node.closest('[role="tablist"]').getBoundingClientRect();
        const css = getComputedStyle(node);
        const badge = node.querySelector('.unica-tabs-count');
        return {
          left: cell.left - rail.left,
          right: rail.right - cell.right,
          outlineWidth: css.outlineWidth,
          outlineOffset: css.outlineOffset,
          countVisibility: getComputedStyle(badge).visibility,
        };
      });
      assert.equal(geometry.outlineWidth, '2px');
      assert.equal(geometry.outlineOffset, '2px');
      assert.ok(
        geometry.left >= 3.5 && geometry.right >= 3.5,
        `${theme}: ${JSON.stringify(geometry)}`,
      );
      assert.equal(geometry.countVisibility, 'visible');
      assert.equal(
        await page.getByRole('button', { name: /Previous views|More views/u }).count(),
        0,
      );
      await pressKeys(page, 'Tab');
      await assertFocused(after(page));
      await page.getByRole('button', { name: 'More views' }).waitFor();
    }
  },

  'Tabs preserves wheel browsing and hides a partial count at the physical edge': async ({
    page,
    mount,
  }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    for (const [theme, direction, textScale, width] of [
      ['soft-dark', 'ltr', 100, 200],
      ['frost-dark', 'rtl', 120, 230],
    ]) {
      await mount('tabs', { theme, direction, textScale, reducedMotion: 'reduce' });
      await change(page, { long: true, order: ['A', 'D', 'G', 'H'], width, distribution: 'equal' });
      const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const viewport = list(page);
      const counted = viewport.getByRole('tab', { name: /^D .*104 reviews/u });
      await before(page).focus();
      await pressKeys(page, 'Tab', forward, forward);
      const badge = await counted.locator('.unica-tabs-count').evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        const { left, right } = node.closest('[role="tablist"]').getBoundingClientRect();
        const crossesEdge =
          (bounds.left < left && bounds.right > left) ||
          (bounds.left < right && bounds.right > right);
        return { crossesEdge, visibility: getComputedStyle(node).visibility };
      });
      assert.deepEqual(badge, { crossesEdge: true, visibility: 'hidden' });

      await pressKeys(page, 'Home', forward);
      await assertFocused(counted);
      const initial = await viewport.evaluate((node) => node.scrollLeft);
      const bounds = await viewport.boundingBox();
      assert.ok(bounds);
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.wheel(direction === 'rtl' ? -85 : 85, 0);
      await page.getByRole('button', { name: 'More views' }).waitFor();
      const travelled = await viewport.evaluate(async (node, start) => {
        for (let frame = 0; frame < 8; frame++) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return Math.abs(node.scrollLeft - start);
      }, initial);
      assert.ok(travelled >= 75, `${theme} retained ${travelled}px of the 85px wheel step`);
      assert.equal(await counted.getAttribute('aria-selected'), 'true');
      await assertFocused(counted);
    }
  },

  'Tabs resolves distribution at list breakpoints and gives every vertical row the rail width':
    async ({ page, mount }) => {
      await mount('tabs');
      await page.setViewportSize({ width: 1600, height: 700 });
      await change(page, { long: true, order: ['A', 'D', 'H'] });
      for (const [width, equal] of [
        [360, true],
        [767, true],
        [768, false],
        [1023, false],
        [1024, true],
        [1439, true],
        [1440, false],
      ]) {
        await change(page, { width });
        const widths = await list(page)
          .getByRole('tab')
          .evaluateAll((nodes) => nodes.map((node) => node.offsetWidth));
        assert.equal(new Set(widths).size === 1, equal, `distribution at ${width}px`);
      }
      await change(page, { width: 200, distribution: 'equal' });
      const equalGeometry = await list(page)
        .getByRole('tab')
        .evaluateAll((nodes) =>
          nodes.map((node) => ({ width: node.offsetWidth, x: node.getBoundingClientRect().x })),
        );
      assert.ok(equalGeometry.every(({ width }) => width >= 96));
      assert.ok(Math.abs(equalGeometry[1].x - equalGeometry[0].x - equalGeometry[0].width - 4) < 1);

      await change(page, { orientation: 'vertical', width: 258 });
      const shapes = await list(page)
        .getByRole('tab')
        .evaluateAll((nodes) =>
          nodes.map((node) => [node.offsetWidth, getComputedStyle(node, '::after').width]),
        );
      assert.ok(shapes.every(([width]) => width === 250));
      assert.equal(shapes[0][1], '2px');
    },
};
