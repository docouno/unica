import assert from 'node:assert/strict';
import { getBox } from '../helpers.mjs';

const selectors = {
  strength: '--_button-light-strength',
  x: '--_button-light-x',
  y: '--_button-light-y',
};

async function light(action) {
  return action.evaluate((element, names) => {
    const style = getComputedStyle(element, '::before');
    return {
      strength: Number(element.style.getPropertyValue(names.strength)),
      x: element.style.getPropertyValue(names.x),
      y: element.style.getPropertyValue(names.y),
      opacity: Number(style.opacity),
      transition: style.transitionDuration,
      filter: style.filter,
    };
  }, selectors);
}

async function expectLight(action, visible, expected) {
  return action.evaluate(
    async (element, { visible, expected, names }) => {
      const limit = performance.now() + 2000;
      while (true) {
        const strength = Number(element.style.getPropertyValue(names.strength));
        const opacity = Number(getComputedStyle(element, '::before').opacity);
        const atExpected = expected === undefined || Math.abs(strength - expected) < 0.03;
        if (
          visible ? strength > 0 && opacity > 0.05 && atExpected : strength === 0 && opacity === 0
        ) {
          return strength;
        }
        if (performance.now() >= limit) {
          throw new Error(
            `Expected light ${visible ? 'on' : 'off'}, got strength ${strength} and opacity ${opacity}`,
          );
        }
        await new Promise(requestAnimationFrame);
      }
    },
    { visible, expected, names: selectors },
  );
}

async function activate(page, name) {
  await page.getByRole('button', { name, exact: true }).evaluate((element) => element.click());
}

async function settle(page) {
  await page.evaluate(async () => {
    for (let frame = 0; frame < 3; frame += 1) {
      await new Promise(requestAnimationFrame);
    }
  });
}

async function facePaint(action) {
  return action.locator('.unica-button-face').evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.backgroundColor, style.backgroundImage, style.boxShadow];
  });
}

async function waitForPaint(action) {
  await action.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations({ subtree: true }).map((animation) => animation.finished),
    );
  });
}

export default {
  'Button Frost proximity illuminates exterior pixels before hover and fades from its last position':
    async ({ page, mount }) => {
      await mount('button-light', { theme: 'frost-dark' });
      const action = page.getByTestId('light-primary');
      const box = await getBox(action);
      const center = box.x + box.width / 2;
      const inside = { x: box.x + 8, y: box.y + 8, width: box.width - 16, height: box.height - 16 };
      const outside = { x: center - 8, y: box.y - 24, width: 16, height: 12 };
      const snapshot = (clip) => page.screenshot({ clip, scale: 'css' });
      await action.focus();
      await expectLight(action, false);
      const rest = await facePaint(action);
      const unlitFace = await snapshot(inside);
      const unlitArea = await snapshot(outside);

      await page.mouse.move(center, box.y - 12);
      await expectLight(action, true, 0.88);
      await waitForPaint(action);
      assert.equal(await action.evaluate((element) => element.matches(':hover')), false);
      assert.deepEqual(await facePaint(action), rest);
      assert.deepEqual(await snapshot(inside), unlitFace, 'face and label pixels remain unchanged');
      assert.notDeepEqual(await snapshot(outside), unlitArea, 'exterior pixels pick up the light');
      const approach = await light(action);
      assert.equal(approach.filter, 'blur(10px)');
      assert.equal(approach.transition, '0.12s');

      await page.mouse.move(center, 5);
      await expectLight(action, false);
      const faded = await light(action);
      assert.deepEqual([faded.x, faded.y], [approach.x, approach.y]);

      await page.mouse.move(center, box.y + box.height / 2);
      await expectLight(action, true);
      await waitForPaint(action);
      assert.equal(await action.evaluate((element) => element.matches(':hover')), true);
      assert.notDeepEqual(await facePaint(action), rest);

      // Scaled Workbench geometry uses local CSS units, including at a rounded corner.
      await action.evaluate((element) => {
        element.style.transformOrigin = 'left top';
        element.style.transform = 'scale(0.75)';
      });
      const scaled = await getBox(action);
      await page.mouse.move(scaled.x + scaled.width / 2, scaled.y - 9);
      await expectLight(action, true, 0.88);
      await page.mouse.move(scaled.x + 0.5, scaled.y - 5);
      await expectLight(action, true);
    },

  'Button Frost clears light on held or unavailable actions and resets media samples': async ({
    page,
    mount,
  }) => {
    await mount('button-light', { theme: 'frost-light' });
    const action = page.getByTestId('light-primary');
    const { x, y, width, height } = await getBox(action);
    const center = x + width / 2;
    await page.mouse.move(center, y - 12);
    await expectLight(action, true);

    for (const flag of ['selection', 'loading', 'disabled', 'fieldset']) {
      await activate(page, 'Toggle ' + flag);
      await expectLight(action, false);
      await activate(page, 'Toggle ' + flag);
      await expectLight(action, true);
    }

    await page.mouse.move(center, y + height / 2);
    await expectLight(action, true);
    await page.mouse.down();
    await expectLight(action, false);
    await page.mouse.up();
    await expectLight(action, true);
    await action.focus();
    await page.keyboard.down('Space');
    await expectLight(action, false);
    await page.keyboard.up('Space');
    await expectLight(action, true);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);
    assert.equal((await light(action)).strength, 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expectLight(action, false);
    await settle(page);
    await expectLight(action, false);
    await page.mouse.move(center, y - 12);
    await expectLight(action, true);
    await page.emulateMedia({ forcedColors: 'active' });
    await settle(page);
    assert.equal((await light(action)).strength, 0);
    await page.emulateMedia({ forcedColors: 'none' });
    await settle(page);
    await expectLight(action, false);

    for (const id of ['neutral', 'danger', 'secondary', 'ghost']) {
      const other = page.getByTestId('light-' + id);
      const box = await getBox(other);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await settle(page);
      assert.equal((await light(other)).strength, 0, id);
    }
  },

  'Button theme changes reuse a stationary sample without Soft and Pixel pointer layout work':
    async ({ page, mount }) => {
      await mount('button-light', { theme: 'soft-dark' });
      const action = page.getByTestId('light-primary');
      const box = await getBox(action);
      const center = box.x + box.width / 2;
      const counters = await action.evaluateHandle((element) => {
        let reads = 0;
        let writes = 0;
        const original = element.getBoundingClientRect;
        element.getBoundingClientRect = () => {
          reads += 1;
          return original.call(element);
        };
        const observer = new MutationObserver((records) => {
          writes += records.length;
        });
        observer.observe(element, { attributes: true, attributeFilter: ['style'] });
        return {
          read: () => [reads, writes, element.dataset.renders],
          disconnect: () => observer.disconnect(),
        };
      });
      await settle(page);
      const before = await counters.evaluate((sample) => sample.read());
      await page.mouse.move(center - 10, box.y - 12);
      await page.mouse.move(center, box.y - 12, { steps: 8 });
      await settle(page);
      assert.deepEqual(await counters.evaluate((sample) => sample.read()), before);
      await expectLight(action, false);

      const theme = (value) =>
        page.evaluate((id) => {
          document.documentElement.dataset.theme = id;
        }, value);
      await theme('frost-dark');
      await expectLight(action, true);
      const frost = await counters.evaluate((sample) => sample.read());
      assert.ok(frost[0] > before[0] && frost[1] > before[1]);
      assert.equal(frost[2], before[2]);

      await theme('pixel-dark');
      await expectLight(action, false);
      await settle(page);
      const pixel = await counters.evaluate((sample) => sample.read());
      await page.mouse.move(center + 10, box.y - 12, { steps: 8 });
      await settle(page);
      assert.deepEqual(await counters.evaluate((sample) => sample.read()), pixel);

      await counters.evaluate((sample) => sample.disconnect());
      await counters.dispose();
    },

  'Button Frost responds to a stationary native top-layer cover and shadow scrolling': async ({
    page,
    mount,
  }) => {
    await mount('button-light', { theme: 'frost-dark' });
    const action = page.getByTestId('light-primary');
    const cover = page.getByTestId('light-cover');
    const modal = page.getByTestId('light-dialog');
    const { x, y, width } = await getBox(action);
    await page.mouse.move(x + 24, y - 12);
    await expectLight(action, true);
    await cover.evaluate((element) => element.showPopover());
    await expectLight(action, false);
    await cover.evaluate((element) => element.hidePopover());
    await expectLight(action, true);

    await cover.evaluate((element) => element.showPopover());
    await expectLight(action, false);
    await page.mouse.move(x + width - 22, y - 12);
    await expectLight(action, true);
    await modal.evaluate((element) => element.showModal());
    await expectLight(action, false);
    await modal.evaluate((element) => element.close());
    await cover.evaluate((element) => element.hidePopover());

    const port = page.getByTestId('light-scrollport');
    const shadowAction = page.getByTestId('shadow-primary');
    const scroll = await getBox(port);
    await page.mouse.move(scroll.x + 70, scroll.y - 10);
    await expectLight(shadowAction, true);
    await port.evaluate((element) => {
      element.scrollTop = 95;
    });
    await expectLight(shadowAction, false);
    await port.evaluate((element) => {
      element.scrollTop = 0;
    });
    await expectLight(shadowAction, true);
  },

  'Button Frost tracks stationary native covers in sibling open shadow trees': async ({
    page,
    mount,
  }) => {
    await mount('button-light', { theme: 'frost-dark' });
    const action = page.getByTestId('light-primary');
    const { x, y, height } = await getBox(action);
    const covers = await action.evaluateHandle((element) => {
      const { left, top, height } = element.getBoundingClientRect();
      const events = [];
      const onPointer = () => events.push('pointermove');
      const onDocumentToggle = () => events.push('document toggle');
      document.addEventListener('pointermove', onPointer, true);
      document.addEventListener('toggle', onDocumentToggle, true);

      function makeCover(host) {
        const root = host.attachShadow({ mode: 'open' });
        const cover = document.createElement('div');
        cover.popover = 'manual';
        Object.assign(cover.style, {
          position: 'fixed',
          inset: `${top}px auto auto ${left - 6}px`,
          width: '64px',
          height: `${height}px`,
          margin: '0',
          padding: '0',
          border: '0',
          background: 'black',
        });
        root.addEventListener('toggle', () => events.push('shadow toggle'), true);
        root.append(cover);
        return cover;
      }

      let cover = makeCover(document.querySelector('[data-testid="light-sibling-host"]'));
      return {
        show() {
          events.length = 0;
          cover.showPopover();
        },
        hide() {
          events.length = 0;
          cover.hidePopover();
        },
        addBranch() {
          const host = document.createElement('div');
          cover = makeCover(host);
          document.body.append(host);
        },
        readEvents: () => events,
        dispose() {
          document.removeEventListener('pointermove', onPointer, true);
          document.removeEventListener('toggle', onDocumentToggle, true);
        },
      };
    });

    await page.mouse.move(x - 12, y + height / 2);
    await expectLight(action, true);
    for (const inserted of [false, true]) {
      if (inserted) {
        await covers.evaluate((lab) => lab.addBranch());
        await settle(page);
      }
      await covers.evaluate((lab) => lab.show());
      await expectLight(action, false);
      assert.deepEqual(await covers.evaluate((lab) => lab.readEvents()), ['shadow toggle']);
      await covers.evaluate((lab) => lab.hide());
      await expectLight(action, true);
      assert.deepEqual(await covers.evaluate((lab) => lab.readEvents()), ['shadow toggle']);
    }
    await covers.evaluate((lab) => lab.dispose());
    await covers.dispose();
  },

  'Button Frost follows the actual scrollport chain for fixed actions': async ({ page, mount }) => {
    await mount('button-light', { theme: 'frost-dark' });
    const escaped = page.getByTestId('light-escaped-action');
    const escapablePort = page.getByTestId('light-escapable-port');
    const cover = page.getByTestId('light-escaped-cover');
    const shim = await page.getByTestId('light-inline-shim').evaluate((element) => ({
      display: getComputedStyle(element).display,
      transform: getComputedStyle(element).transform,
    }));
    assert.equal(shim.display, 'inline');
    assert.notEqual(shim.transform, 'none');
    const fixed = await getBox(escaped);
    const outer = await getBox(escapablePort);
    assert.ok(
      fixed.x < outer.x && outer.x < fixed.x + fixed.width,
      'the nominal clip cuts across the viewport-fixed button',
    );
    await page.mouse.move(fixed.x - 12, fixed.y + fixed.height / 2);
    await expectLight(escaped, true, 0.88);
    await cover.evaluate((element) => element.showPopover());
    await expectLight(escaped, false);
    await cover.evaluate((element) => element.hidePopover());
    await expectLight(escaped, true, 0.88);
    await escapablePort.evaluate((element) => {
      element.style.opacity = '0';
    });
    await expectLight(escaped, false);
    await escapablePort.evaluate((element) => {
      element.style.removeProperty('opacity');
    });
    await expectLight(escaped, true);

    const transformed = page.getByTestId('light-transformed-action');
    const transformedPort = page.getByTestId('light-transformed-port');
    const falsePort = page.getByTestId('light-outer-port');
    const clipped = await getBox(transformed);
    const inner = await getBox(transformedPort);
    const nominal = await getBox(falsePort);
    assert.ok(
      inner.x > nominal.x + nominal.width,
      'the transformed scrollport escapes its outer scrollport',
    );
    assert.ok(
      inner.x > clipped.x,
      'transformed scrollport clips the left side of its fixed button',
    );
    await page.mouse.move(clipped.x - 12, clipped.y + clipped.height / 2);
    await expectLight(transformed, true);
    assert.equal(
      (await light(transformed)).strength,
      0.5,
      'distance uses the actual clip boundary',
    );

    const restoreOffsetParent = await transformed.evaluateHandle((action) => {
      const prototype = HTMLElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'offsetParent');
      Object.defineProperty(prototype, 'offsetParent', {
        ...descriptor,
        get() {
          return this === action ? null : descriptor.get.call(this);
        },
      });
      return () => Object.defineProperty(prototype, 'offsetParent', descriptor);
    });
    try {
      await page.mouse.move(clipped.x - 22, clipped.y + clipped.height / 2);
      await expectLight(transformed, true, 0.4);
    } finally {
      await restoreOffsetParent.evaluate((restore) => restore());
      await restoreOffsetParent.dispose();
    }

    await transformed.evaluate((element) => {
      element.style.zoom = '1.1';
    });
    const zoomed = await getBox(transformed);
    await page.mouse.move(inner.x - 60, zoomed.y + zoomed.height / 2);
    await expectLight(transformed, true, 0.455);
  },

  'Button Frost respects a native cover over zoomed absolute and fixed edges': async ({
    page,
    mount,
  }) => {
    await mount('button-light', { theme: 'frost-dark' });
    const action = page.getByTestId('light-zoom-action');
    const frame = page.getByTestId('light-positioned-frame');
    const cover = page.getByTestId('light-zoom-cover');

    for (const position of ['absolute', 'fixed']) {
      await frame.evaluate((element, position) => {
        const action = element.querySelector('button');
        element.style.transform = position === 'fixed' ? 'translateZ(0)' : '';
        action.style.position = position;
      }, position);
      const { x, y, width, height } = await getBox(action);
      assert.ok(width > 150, 'CSS zoom scales the positioned action');
      await page.mouse.move(x - 12, y + height / 2);
      await expectLight(action, true, 0.89);
      await cover.evaluate((element) => element.showPopover());
      const stack = await action.evaluate((element) => {
        const { left, top, height } = element.getBoundingClientRect();
        return document
          .elementsFromPoint(left + 1, top + height / 2)
          .map((hit) => hit.closest('[data-testid]')?.getAttribute('data-testid'));
      });
      assert.equal(stack[0], 'light-zoom-cover');
      assert.ok(stack.includes('light-zoom-action'));
      await expectLight(action, false);
      await cover.evaluate((element) => element.hidePopover());
      await expectLight(action, true, 0.89);
    }
  },

  'Button Frost rebinds when a ref-transparent router replaces its anchor': async ({
    page,
    mount,
  }) => {
    await mount('button-light', { theme: 'frost-dark' });
    const router = page.getByTestId('light-router');
    const { x, y, height } = await getBox(router);
    await page.mouse.move(x - 12, y + height / 2);
    await expectLight(router, true);
    const oldAnchor = await router.elementHandle();
    assert.equal(await router.getAttribute('href'), '/initial');
    await router.evaluate((element) => element.click());
    await page.locator('[data-testid="light-router"][href="/replacement"]').waitFor();
    await expectLight(router, true);
    assert.equal((await light(router)).strength, 0.88);
    assert.deepEqual(
      await oldAnchor.evaluate(
        (element, variables) => ({
          connected: element.isConnected,
          style: variables.map((name) => element.style.getPropertyValue(name)),
        }),
        Object.values(selectors),
      ),
      { connected: false, style: ['', '', ''] },
    );
    await oldAnchor.dispose();
  },

  'Button pointer samples do not cross shadow iframe boundaries or leak between owner documents':
    async ({ page, mount }) => {
      await mount('button-light', { theme: 'frost-dark' });
      const action = page.getByTestId('light-primary');
      const root = page.getByTestId('light-shadow-host');
      const neighbor = page.getByTestId('shadow-neighbor');
      const iframe = page.locator('iframe[title="Nested pointer region"]');
      const outer = await getBox(action);
      const insideShadow = await getBox(neighbor);
      const insideFrame = await getBox(iframe);
      const row = outer.y + outer.height / 2;
      const target = { x: insideFrame.x + 20, y: row };

      const trace = await root.evaluateHandle((host) => {
        const documentTrace = [];
        const shadowTrace = [];
        const record = (events) => (event) => {
          events.push([event.type, event.composedPath()[0]?.localName]);
        };
        for (const name of ['pointerout', 'pointerover']) {
          document.addEventListener(name, record(documentTrace), true);
          host.shadowRoot.addEventListener(name, record(shadowTrace), true);
        }
        return {
          reset() {
            documentTrace.length = 0;
            shadowTrace.length = 0;
          },
          read: () => ({ documentTrace, shadowTrace }),
        };
      });

      await page.mouse.move(outer.x + outer.width + 15, row);
      await expectLight(action, true);
      await trace.evaluate((recorder) => recorder.reset());
      await page.mouse.move(target.x, target.y);
      await expectLight(action, false);
      assert.ok(
        (await trace.evaluate((recorder) => recorder.read())).documentTrace.some(
          ([, element]) => element === 'iframe',
        ),
        'document sees the open shadow iframe in the composed path on outside entry',
      );

      await page.mouse.move(insideShadow.x + 10, row);
      await expectLight(action, true);
      await trace.evaluate((recorder) => recorder.reset());
      await page.mouse.move(target.x, target.y);
      await expectLight(action, false);
      const internal = await trace.evaluate((recorder) => recorder.read());
      assert.ok(internal.shadowTrace.some(([, element]) => element === 'iframe'));
      assert.deepEqual(internal.documentTrace, []);
      await page.evaluate(() => {
        document.documentElement.dataset.surface = 'overlay';
      });
      await settle(page);
      await expectLight(action, false);
      await page.mouse.move(outer.x + outer.width + 15, row);
      await expectLight(action, true);

      const independent = page
        .frameLocator('iframe[title="Independent pointer document"]')
        .getByTestId('iframe-primary');
      const inner = await getBox(independent);
      await page.mouse.move(inner.x - 12, inner.y + inner.height / 2);
      await expectLight(independent, true);
      await expectLight(action, false);
      await activate(page, 'Toggle parent actions');
      await action.waitFor({ state: 'detached' });
      await expectLight(independent, true);
      await trace.dispose();
    },
};
