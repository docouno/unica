import assert from 'node:assert/strict';
import { assertFocused, getBox, pressKeys, resetForm, submitForm } from '../helpers.mjs';

const button = (page, name) => page.getByRole('button', { name, exact: true });
const byId = (page, id) => page.locator('#' + id);
const log = async (locator) => JSON.parse(await locator.textContent());
const controlledLog = (page) => byId(page, 'controlled-log');
const entries = (locator) => locator.evaluate((node) => [...new FormData(node)]);
const command = (page, id) => byId(page, id).evaluate((element) => element.click());

async function hideWithQueuedFocus(page, id, targets, { blur = false, reveal = false } = {}) {
  await page.evaluate(
    ({ id, targets, blur, reveal }) => {
      const panel = document.getElementById(id);
      const chooseFocus = (event) => {
        if (event.target === panel && event.newState === 'closed') {
          document.removeEventListener('beforetoggle', chooseFocus, true);
          queueMicrotask(() => {
            for (const target of targets) {
              const element = document.getElementById(target);
              if (reveal) {
                element.style.display = '';
              }
              element.focus();
            }
          });
        }
      };
      if (blur) {
        document.activeElement.blur();
      }
      document.addEventListener('beforetoggle', chooseFocus, true);
      panel.hidePopover();
    },
    { id, targets, blur, reveal },
  );
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

function waitOpen(page, id, open = true) {
  const selector = '#' + id + ':popover-open';
  return page.locator(selector).waitFor({ state: open ? 'attached' : 'detached' });
}

function setHandlerMode(page, mode) {
  return byId(page, 'controlled-example').evaluate((element, value) => {
    element.dataset.handlerMode = value;
  }, mode);
}

async function recordFocus(page) {
  return page.evaluateHandle(() => {
    const focus = [];
    document.addEventListener('focusin', (event) => {
      focus.push(event.target.id || event.target.getAttribute('data-testid'));
    });
    return focus;
  });
}

async function tap(cdp, locator, end = 'touchEnd') {
  const { x, y, width, height } = await getBox(locator);
  const point = { x: x + width / 2, y: y + height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await cdp.send('Input.dispatchTouchEvent', { type: end, touchPoints: [] });
}

async function openModalChain(page, mode) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        while (navigator.userActivation.isActive) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        document.querySelector('#open-${mode}-modal').click();
        document.querySelector('#modal-chain-program-open').click();
        for (let frame = 0; !document.querySelector('#modal-chain-parent:popover-open'); frame++) {
          if (frame === 120) throw new Error('The parent Popover did not open');
          await new Promise(requestAnimationFrame);
        }
        document.querySelector('#modal-chain-program-child').click();
        return navigator.userActivation.isActive;
      })()`,
      awaitPromise: true,
      returnByValue: true,
      userGesture: false,
    });
    assert.equal(exceptionDetails, undefined, exceptionDetails?.exception?.description);
    assert.equal(result.value, false, 'Both overlays open without transient user activation');
  } finally {
    await cdp.detach();
  }
}

async function verifyModalChain({ page, mount }, mode, modalDismissal) {
  await mount('popover');
  await openModalChain(page, mode);
  const modal = page.locator('#popover-modal:modal');
  const modalLog = byId(page, 'modal-log');
  const reports = byId(page, 'modal-chain-log');
  await waitOpen(page, 'modal-chain-child');
  await assertFocused(byId(page, 'modal-chain-child'));

  await pressKeys(page, 'Escape');
  await waitOpen(page, 'modal-chain-child', false);
  await waitOpen(page, 'modal-chain-parent');
  await modal.waitFor();
  assert.deepEqual(await log(reports), ['child:false']);
  assert.deepEqual(await log(modalLog), []);
  await assertFocused(byId(page, 'modal-chain-child-trigger'));

  await pressKeys(page, 'Escape');
  await waitOpen(page, 'modal-chain-parent', false);
  await modal.waitFor();
  assert.deepEqual(await log(reports), ['child:false', 'parent:false']);
  assert.deepEqual(await log(modalLog), []);
  await assertFocused(byId(page, 'modal-chain-parent-trigger'));

  await pressKeys(page, 'Escape');
  await modal.waitFor({ state: 'detached' });
  assert.deepEqual(await log(modalLog), [modalDismissal]);
}

export default {
  'Popover applies disabled to native links and composed sources and restores focus to an available source':
    async ({ page, mount, renderFixture }) => {
      const native = byId(page, 'composed-disabled-native');
      await page.setContent(await renderFixture('popover-composed-sources'));
      assert.equal(await native.getAttribute('href'), null, 'SSR must produce no actionable URL');
      assert.equal(await native.getAttribute('role'), 'link');
      assert.equal(await native.getAttribute('tabindex'), null);
      await native.click({ force: true });
      assert.equal(new URL(page.url()).hash, '');

      await mount('popover-composed-sources');
      assert.ok(await native.isDisabled());
      assert.equal(await native.getAttribute('href'), null);
      await native.click({ force: true });
      await native.click({ button: 'middle', force: true });
      await native.dispatchEvent('keydown', { key: 'Enter' });
      await byId(page, 'composed-disabled-native-button').click({ button: 'middle', force: true });
      for (const id of [
        'composed-disabled-button',
        'composed-disabled-icon',
        'composed-disabled-anchor',
        'composed-disabled-link',
      ]) {
        const source = byId(page, id);
        assert.ok(await source.isDisabled(), id);
        await command(page, id);
      }
      const reports = byId(page, 'composed-log');
      const source = byId(page, 'composed-source');
      const panel = byId(page, 'composed-panel');
      assert.deepEqual(await log(reports), []);
      await waitOpen(page, 'composed-panel', false);
      assert.equal(new URL(page.url()).hash, '');

      await command(page, 'composed-open');
      await page.locator('#composed-panel:popover-open[data-side]').waitFor();
      const width = await source.evaluate((element) => element.getBoundingClientRect().width);
      assert.equal(
        await panel.evaluate((element) =>
          parseFloat(element.style.getPropertyValue('--anchor-width')),
        ),
        width,
      );
      await assertFocused(panel);

      await command(page, 'composed-disable-source');
      await waitOpen(page, 'composed-panel', false);
      await byId(page, 'composed-fallback').and(page.locator(':focus')).waitFor();
      assert.ok(await source.isDisabled());
      assert.deepEqual(await log(reports), [false]);
    },

  'Popover skips sources disabled by Save before native focus restoration': async ({
    page,
    mount,
  }) => {
    await mount('popover-composed-sources');
    for (const [id, resultingFocus] of [
      ['save-native', 'body'],
      ['save-composed-alone', 'body'],
      ['save-composed', '#save-composed-fallback'],
    ]) {
      const source = byId(page, `${id}-source`);
      await source.focus();
      await pressKeys(page, 'Enter');
      await waitOpen(page, `${id}-panel`);
      await assertFocused(byId(page, `${id}-save`));
      const focus = await recordFocus(page);

      await pressKeys(page, 'Enter');
      await waitOpen(page, `${id}-panel`, false);
      await page.waitForFunction(
        (target) => document.activeElement === document.querySelector(target),
        resultingFocus,
      );
      assert.ok(await source.isDisabled());
      assert.ok(!(await focus.jsonValue()).includes(`${id}-source`));
    }
  },

  'Popover controlled proposals honor slot order, cancellation and native admission': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const trigger = byId(page, 'controlled-trigger');
    const panel = byId(page, 'controlled-panel');
    const reports = controlledLog(page);
    assert.equal(await trigger.getAttribute('aria-haspopup'), 'dialog');
    assert.equal(await trigger.getAttribute('aria-controls'), 'controlled-panel');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

    for (const mode of ['child-stop', 'ancestor-stop']) {
      await setHandlerMode(page, mode);
      await trigger.click();
      assert.deepEqual(JSON.parse(await reports.getAttribute('data-handlers')).slice(-3), [
        'child',
        'trigger',
        'proposal',
      ]);
      assert.equal(await panel.evaluate((element) => element.matches(':popover-open')), false);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    }
    assert.deepEqual(await log(reports), [true, true]);

    for (const mode of ['child-cancel', 'trigger-cancel', 'capture-stop']) {
      await setHandlerMode(page, mode);
      await trigger.click();
      await waitOpen(page, 'controlled-panel', false);
      assert.deepEqual(await log(reports), [true, true]);
    }
    assert.equal(
      await panel.evaluate((element) => {
        element.showPopover();
        return element.matches(':popover-open');
      }),
      false,
      'an external show call cannot open a controlled closed carrier',
    );

    await setHandlerMode(page, 'child-stop');
    await command(page, 'controlled-open');
    const dialog = page.getByRole('dialog', { name: 'Controlled panel', exact: true });
    await dialog.waitFor();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await byId(page, 'controlled-link').getAttribute('aria-expanded'), 'true');
    assert.deepEqual(
      new Set((await dialog.getAttribute('aria-describedby')).split(/\s+/)),
      new Set(['controlled-note', 'controlled-description']),
    );
    assert.equal(
      (await dialog.getAttribute('aria-describedby')).split(/\s+/).length,
      2,
      'the description slot and explicit description identifiers deduplicate',
    );
    assert.deepEqual(await log(reports), [true, true], 'a prop update emits no proposal');

    await trigger.click();
    assert.deepEqual(await log(reports), [true, true, false]);
    assert.equal(await panel.evaluate((element) => element.matches(':popover-open')), true);
    await button(page, 'Close controlled panel').click();
    assert.deepEqual(await log(reports), [true, true, false, false]);
    assert.equal(await panel.evaluate((element) => element.matches(':popover-open')), true);
    await command(page, 'controlled-close');
    await waitOpen(page, 'controlled-panel', false);
    assert.deepEqual(await log(reports), [true, true, false, false]);
    assert.equal(
      await panel.getAttribute('aria-describedby'),
      'controlled-note controlled-description',
    );
    assert.equal(await byId(page, 'controlled-draft').count(), 0);
  },

  'Popover native dismiss absorbs the same source click and preserves the next activation': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const link = byId(page, 'controlled-link');
    const reports = controlledLog(page);
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await link.click();
    await waitOpen(page, 'controlled-panel', false);
    assert.deepEqual(await log(reports), [false]);
    assert.equal(await link.getAttribute('aria-expanded'), 'false');
    assert.equal(new URL(page.url()).hash, '', 'the edit link suppresses ordinary navigation');

    await command(page, 'controlled-rerender');
    assert.equal(await reports.getAttribute('data-updates'), '1');
    assert.equal(
      await byId(page, 'controlled-panel').evaluate((element) => element.matches(':popover-open')),
      false,
    );

    await link.click();
    await waitOpen(page, 'controlled-panel');
    assert.deepEqual(await log(reports), [false, true]);
    await assertFocused(byId(page, 'controlled-draft'));
    await pressKeys(page, 'Escape');
    await waitOpen(page, 'controlled-panel', false);
    assert.deepEqual(await log(reports), [false, true, false]);
    await assertFocused(link);
  },

  'Popover source links keep modified and middle navigation and handle Enter': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const link = byId(page, 'controlled-link');
    const context = page.context();
    for (const options of [{ modifiers: ['Control'] }, { button: 'middle' }]) {
      const [tab] = await Promise.all([context.waitForEvent('page'), link.click(options)]);
      await tab.waitForURL(/#popover-destination$/);
      await tab.close();
      assert.deepEqual(await log(controlledLog(page)), []);
      assert.equal(new URL(page.url()).hash, '');
    }
    await setHandlerMode(page, 'accept');
    await link.focus();
    await pressKeys(page, 'Enter');
    await waitOpen(page, 'controlled-panel');
    assert.deepEqual(await log(controlledLog(page)), [true]);
    await assertFocused(byId(page, 'controlled-draft'));
  },

  'Popover reports a native close before a new scripted activation in the same task': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    await setHandlerMode(page, 'accept');
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await page.evaluate(() => {
      document.querySelector('#controlled-panel').hidePopover();
      document.querySelector('#controlled-trigger').click();
    });
    await waitOpen(page, 'controlled-panel');
    assert.deepEqual(await log(controlledLog(page)), [false, true]);
    await assertFocused(byId(page, 'controlled-panel'));
  },

  'Popover chooses a visible source before show and can reuse a recovered anchor': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    await setHandlerMode(page, 'accept');
    const trigger = byId(page, 'controlled-trigger');
    const alternate = byId(page, 'controlled-link');
    const reports = controlledLog(page);
    await trigger.evaluate((element) => {
      element.style.transform = 'translateY(-2000px)';
    });
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    assert.deepEqual(await log(reports), []);
    await button(page, 'Close controlled panel').click();
    await waitOpen(page, 'controlled-panel', false);
    await assertFocused(alternate);

    await trigger.evaluate((element) => {
      element.style.transform = '';
    });
    await alternate.evaluate((element) => {
      element.hidden = true;
    });
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await trigger.evaluate((element) => {
      element.style.visibility = 'hidden';
    });
    await waitOpen(page, 'controlled-panel', false);
    assert.deepEqual(await log(reports), [false, false]);
    await trigger.evaluate((element) => {
      element.style.visibility = '';
    });
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    assert.deepEqual(await log(reports), [false, false]);
  },

  'Popover rejects a fully clipped explicit trigger before disturbing an open layer': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    await setHandlerMode(page, 'accept');
    await command(page, 'page-chain-program-open');
    await waitOpen(page, 'page-chain-parent');
    await byId(page, 'controlled-trigger').evaluate((element) => {
      element.style.transform = 'translateY(-2000px)';
      element.click();
    });
    await page.waitForFunction(
      () => document.querySelector('#controlled-log').textContent === '[true,false]',
    );
    await waitOpen(page, 'controlled-panel', false);
    await waitOpen(page, 'page-chain-parent');
    await assertFocused(byId(page, 'page-chain-parent'));
    assert.deepEqual(await log(byId(page, 'page-chain-log')), []);
  },

  'Popover skips a fully clipped fallback trigger when the source is lost': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const outside = byId(page, 'controlled-outside');
    await byId(page, 'controlled-link').evaluate((element) => {
      element.style.transform = 'translateY(-2000px)';
    });
    await outside.focus();
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await assertFocused(byId(page, 'controlled-panel'));
    await byId(page, 'controlled-trigger').evaluate((element) => {
      element.style.visibility = 'hidden';
    });
    await waitOpen(page, 'controlled-panel', false);
    await assertFocused(outside);
    assert.deepEqual(await log(controlledLog(page)), [false]);
  },

  'Popover can focus the first tabbable editing host': async ({ page, mount }) => {
    await mount('popover');
    await setHandlerMode(page, 'accept');
    await byId(page, 'controlled-panel').evaluate((element) => {
      element.addEventListener(
        'beforetoggle',
        (event) => {
          if (event.newState === 'open') {
            const skipped = document.createElement('div');
            skipped.contentEditable = 'true';
            skipped.tabIndex = -1;
            skipped.textContent = 'Programmatic editor';
            const editor = document.createElement('div');
            editor.contentEditable = 'true';
            editor.id = 'inline-editor';
            editor.textContent = 'Tabbable editor';
            element.querySelector('.unica-popover-body').prepend(skipped, editor);
          }
        },
        { once: true },
      );
    });
    await byId(page, 'controlled-trigger').click();
    await waitOpen(page, 'controlled-panel');
    await assertFocused(byId(page, 'inline-editor'));
  },

  'Popover outside click and Tab close once while keeping the outside focus': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const trigger = byId(page, 'controlled-trigger');
    const outside = byId(page, 'controlled-outside');
    const reports = controlledLog(page);
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await outside.click();
    await waitOpen(page, 'controlled-panel', false);
    await assertFocused(outside);
    assert.equal(await reports.getAttribute('data-outside-clicks'), '1');
    assert.deepEqual(await log(reports), [false]);

    await trigger.click();
    await waitOpen(page, 'controlled-panel');
    const close = button(page, 'Close controlled panel');
    await close.focus();
    await pressKeys(page, 'Shift+Tab');
    await assertFocused(trigger);
    await waitOpen(page, 'controlled-panel');
    await byId(page, 'controlled-last').focus();
    await pressKeys(page, 'Tab');
    await waitOpen(page, 'controlled-panel', false);
    await assertFocused(outside);
    assert.deepEqual(await log(reports), [false, true, false]);

    await command(page, 'controlled-rerender');
    await waitOpen(page, 'controlled-panel', false);
    assert.deepEqual(await log(reports), [false, true, false]);

    await trigger.click();
    await waitOpen(page, 'controlled-panel');
    await byId(page, 'controlled-link').focus();
    await pressKeys(page, 'Tab');
    await waitOpen(page, 'controlled-panel', false);
    await assertFocused(byId(page, 'page-chain-parent-trigger'));
    assert.deepEqual(await log(reports), [false, true, false, true, false]);
  },

  'Popover programmatic and trusted touch opening shield descendant autofocus': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    let focus = await recordFocus(page);
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await assertFocused(byId(page, 'controlled-panel'));
    assert.deepEqual(await focus.jsonValue(), ['controlled-panel']);
    await focus.dispose();

    await mount('popover');
    focus = await recordFocus(page);
    await setHandlerMode(page, 'accept');
    const trigger = byId(page, 'controlled-trigger');
    await trigger.evaluate((element) => {
      element.addEventListener(
        'pointerdown',
        (event) => {
          element.dataset.pointer = event.pointerType + ':' + event.isTrusted;
        },
        { once: true },
      );
    });
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      await tap(cdp, trigger);
      await waitOpen(page, 'controlled-panel');
      assert.equal(await trigger.getAttribute('data-pointer'), 'touch:true');
      await assertFocused(byId(page, 'controlled-panel'));
      assert.ok(!(await focus.jsonValue()).includes('controlled-draft'));

      const field = byId(page, 'controlled-draft');
      await tap(cdp, field);
      await assertFocused(field);
      assert.equal((await focus.jsonValue()).filter((id) => id === 'controlled-draft').length, 1);
      assert.deepEqual(await log(controlledLog(page)), [true]);

      await setHandlerMode(page, '');
      const link = byId(page, 'controlled-link');
      await tap(cdp, link, 'touchCancel');
      await waitOpen(page, 'controlled-panel');
      assert.deepEqual(await log(controlledLog(page)), [true]);

      await tap(cdp, link);
      await waitOpen(page, 'controlled-panel', false);
      assert.deepEqual(await log(controlledLog(page)), [true, false]);
      assert.equal(new URL(page.url()).hash, '');
      await tap(cdp, link);
      await waitOpen(page, 'controlled-panel');
      assert.deepEqual(await log(controlledLog(page)), [true, false, true]);
      await assertFocused(byId(page, 'controlled-panel'));
    } finally {
      await cdp.detach();
      await focus.dispose();
    }
  },

  'Popover nested Escape unwinds one panel and respects a consuming child widget': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const parent = byId(page, 'page-chain-parent-trigger');
    const child = byId(page, 'page-chain-child-trigger');
    const reports = byId(page, 'page-chain-log');

    await parent.click();
    await child.click();
    await waitOpen(page, 'page-chain-child');
    await assertFocused(byId(page, 'page-chain-child-action'));
    await command(page, 'page-chain-consume-escape');
    await pressKeys(page, 'Escape');
    await waitOpen(page, 'page-chain-child');
    assert.deepEqual(await log(reports), ['parent:true', 'child:true']);

    await pressKeys(page, 'Escape');
    await waitOpen(page, 'page-chain-child', false);
    await waitOpen(page, 'page-chain-parent');
    await child.and(page.locator(':focus')).waitFor();

    await byId(page, 'page-chain-open-manual').click();
    await waitOpen(page, 'page-chain-manual');
    await assertFocused(page.getByRole('option', { name: 'List option' }));
    await pressKeys(page, 'Escape');
    await waitOpen(page, 'page-chain-manual', false);
    await waitOpen(page, 'page-chain-parent');
    assert.deepEqual(await log(reports), ['parent:true', 'child:true', 'child:false']);

    await child.focus();
    await pressKeys(page, 'Escape');
    await waitOpen(page, 'page-chain-parent', false);
    assert.deepEqual(await log(reports), [
      'parent:true',
      'child:true',
      'child:false',
      'parent:false',
    ]);
    await parent.and(page.locator(':focus')).waitFor();
  },

  'Popover inside a native modal closes one layer per Escape': (context) =>
    verifyModalChain(context, 'native', 'cancel'),

  'Popover admits an initially open child after the parent releases its focus guard': async ({
    page,
    mount,
  }) => {
    await mount('popover-initial-chain');
    const child = byId(page, 'initial-chain-child');
    await byId(page, 'initial-chain-parent-trigger').click();
    await waitOpen(page, 'initial-chain-parent');
    await waitOpen(page, 'initial-chain-child');
    await assertFocused(child);
    assert.deepEqual(await log(byId(page, 'initial-chain-log')), ['parent:true']);

    await pressKeys(page, 'Escape');
    await waitOpen(page, 'initial-chain-child', false);
    await waitOpen(page, 'initial-chain-parent');
    await byId(page, 'initial-chain-child-trigger').and(page.locator(':focus')).waitFor();
  },

  'Popover inside a registered modal closes one layer per Escape': (context) =>
    verifyModalChain(context, 'registered', 'escape'),

  'Popover in-place fields use native form validation, data, reset and removal': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const form = byId(page, 'popover-form');
    const trigger = byId(page, 'form-trigger');
    const field = byId(page, 'form-path');
    const submit = button(page, 'Save draft');
    const close = button(page, 'Close form fields');
    const submits = byId(page, 'form-log');
    assert.deepEqual(await entries(form), [['permanent', 'keep']]);
    assert.equal(await trigger.getAttribute('type'), 'button');
    await trigger.click();
    await waitOpen(page, 'form-panel');
    await assertFocused(field);
    assert.equal(await close.getAttribute('type'), 'button');
    assert.equal(await field.evaluate((element) => element.form.id), 'popover-form');
    assert.equal(await submit.evaluate((element) => element.form.id), 'popover-form');
    assert.equal(await submits.textContent(), '0');

    await field.fill('');
    await submit.click();
    assert.equal(await field.evaluate((element) => element.validity.valueMissing), true);
    await assertFocused(field);
    await waitOpen(page, 'form-panel');
    assert.equal(await submits.textContent(), '0');

    await field.fill('/edited');
    const checkbox = page.getByRole('checkbox', { name: 'Pin document' });
    await checkbox.uncheck();
    assert.deepEqual(await entries(form), [
      ['permanent', 'keep'],
      ['path', '/edited'],
    ]);
    await resetForm(form);
    assert.equal(await field.inputValue(), '/guide');
    assert.equal(await checkbox.isChecked(), true);
    assert.deepEqual(await submitForm(form, submit), [
      ['permanent', 'keep'],
      ['path', '/guide'],
      ['pinned', 'yes'],
      ['action', 'save'],
    ]);
    assert.equal(await submits.textContent(), '1');

    await close.click();
    await waitOpen(page, 'form-panel', false);
    await assertFocused(trigger);
    assert.equal(await field.count(), 0);
    assert.deepEqual(await entries(form), [['permanent', 'keep']]);
    assert.equal(await submits.textContent(), '1');
  },

  'Popover defaultOpen hydrates a stable closed carrier before mounting its children': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('popover-ssr');
    await mount('popover-hydration');
    const panel = page.getByTestId('hydration-panel');
    const serverNode = await byId(page, 'hydration-root').evaluateHandle((element, markup) => {
      element.innerHTML = markup;
      return element.querySelector('[data-testid=hydration-panel]');
    }, html);
    try {
      const trigger = byId(page, 'hydration-trigger');
      assert.equal(await panel.getAttribute('popover'), 'auto');
      assert.equal(await panel.evaluate((element) => element.matches(':popover-open')), false);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      const serverId = await panel.getAttribute('id');
      assert.ok(serverId);
      assert.equal(await trigger.getAttribute('aria-controls'), null);
      assert.equal(await byId(page, 'hydration-draft').count(), 0);

      const focus = await recordFocus(page);
      try {
        await button(page, 'Hydrate popover').click();
        await page.getByRole('dialog', { name: 'Hydrated panel' }).waitFor();
        assert.equal(
          await panel.evaluate((element, before) => element === before, serverNode),
          true,
        );
        assert.equal(await panel.getAttribute('id'), serverId);
        assert.equal(await trigger.getAttribute('aria-controls'), serverId);
        assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
        assert.equal(await panel.evaluate((element) => element.matches(':popover-open')), true);
        await assertFocused(panel);
        assert.ok(!(await focus.jsonValue()).includes('hydration-draft'));
        assert.deepEqual(await log(byId(page, 'hydration-log')), []);
        assert.deepEqual(await log(byId(page, 'hydration-errors')), []);
      } finally {
        await focus.dispose();
      }
    } finally {
      await serverNode.dispose();
    }
  },

  'Popover samples a fallback clipped in the same task as its source becomes hidden': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const outside = byId(page, 'controlled-outside');
    const trace = await recordFocus(page);
    try {
      await outside.focus();
      await command(page, 'controlled-open');
      await waitOpen(page, 'controlled-panel');
      await page.evaluate(() => {
        document.querySelector('#controlled-link').style.clipPath = 'inset(50%)';
        document.querySelector('#controlled-trigger').style.visibility = 'hidden';
      });
      await waitOpen(page, 'controlled-panel', false);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await assertFocused(outside);
      assert.ok(!(await trace.jsonValue()).includes('controlled-link'));
      assert.deepEqual(await log(controlledLog(page)), [false]);
    } finally {
      await trace.dispose();
    }
  },

  'Popover preserves external focus chosen while native focus return is pending': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const outside = byId(page, 'controlled-outside');
    await outside.focus();
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await byId(page, 'controlled-panel').evaluate((element) => {
      element.addEventListener(
        'beforetoggle',
        (event) => {
          if (event.newState === 'closed') {
            queueMicrotask(() => {
              document.querySelector('#page-chain-parent-trigger').focus();
              document.querySelector('#controlled-outside').focus();
            });
          }
        },
        { once: true },
      );
    });
    await page.keyboard.press('Escape');
    await waitOpen(page, 'controlled-panel', false);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await assertFocused(outside);
    assert.deepEqual(await log(controlledLog(page)), [false]);
  },

  'Popover preserves external focus chosen before the native dismiss report': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const outside = byId(page, 'controlled-outside');
    await outside.focus();
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await hideWithQueuedFocus(page, 'controlled-panel', [
      'page-chain-parent-trigger',
      'controlled-outside',
    ]);
    await waitOpen(page, 'controlled-panel', false);
    await assertFocused(outside);
    assert.deepEqual(await log(controlledLog(page)), [false]);
  },

  'Popover preserves external focus after its own focus has been blurred': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    const outside = byId(page, 'controlled-outside');
    await outside.focus();
    await command(page, 'controlled-open');
    await waitOpen(page, 'controlled-panel');
    await hideWithQueuedFocus(page, 'controlled-panel', ['controlled-outside'], { blur: true });
    await waitOpen(page, 'controlled-panel', false);
    await assertFocused(outside);
    assert.deepEqual(await log(controlledLog(page)), [false]);
  },

  'Popover preserves the focus selected in the parent when a nested panel closes': async ({
    page,
    mount,
  }) => {
    await mount('popover');
    await command(page, 'page-chain-program-open');
    await waitOpen(page, 'page-chain-parent');
    const prior = byId(page, 'page-chain-open-manual');
    await prior.focus();
    await command(page, 'page-chain-program-child');
    await waitOpen(page, 'page-chain-child');
    await assertFocused(byId(page, 'page-chain-child'));
    await hideWithQueuedFocus(page, 'page-chain-child', ['page-chain-open-manual']);
    await waitOpen(page, 'page-chain-child', false);
    await waitOpen(page, 'page-chain-parent');
    await assertFocused(prior);
    assert.deepEqual(await log(byId(page, 'page-chain-log')), ['child:false']);
  },

  'Popover preserves focus explicitly given to a previous element that was hidden at dismissal':
    async ({ page, mount }) => {
      await mount('popover');
      const outside = byId(page, 'controlled-outside');
      await outside.focus();
      await command(page, 'controlled-open');
      await waitOpen(page, 'controlled-panel');
      await outside.evaluate((element) => {
        element.style.display = 'none';
      });
      await hideWithQueuedFocus(page, 'controlled-panel', ['controlled-outside'], { reveal: true });
      await waitOpen(page, 'controlled-panel', false);
      await assertFocused(outside);
      assert.deepEqual(await log(controlledLog(page)), [false]);
    },

  'Popover preserves a synchronous beforetoggle focus choice on both close paths': async ({
    page,
    mount,
  }) => {
    for (const close of ['native', 'requested']) {
      await mount('popover');
      const outside = byId(page, 'controlled-outside');
      await outside.focus();
      await command(page, 'controlled-open');
      await waitOpen(page, 'controlled-panel');
      await byId(page, 'controlled-panel').evaluate((element, close) => {
        element.addEventListener(
          'beforetoggle',
          (event) => {
            if (event.newState === 'closed') {
              document.getElementById('controlled-outside').focus();
            }
          },
          { once: true },
        );
        if (close === 'native') {
          element.hidePopover();
        } else {
          document.getElementById('controlled-close').click();
        }
      }, close);
      await waitOpen(page, 'controlled-panel', false);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await assertFocused(outside);
      assert.deepEqual(await log(controlledLog(page)), close === 'native' ? [false] : []);
    }
  },
};
