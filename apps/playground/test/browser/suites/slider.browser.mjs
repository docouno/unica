import assert from 'node:assert/strict';
import { assertFocused } from '../helpers.mjs';

const hit = '.unica-slider-hit';
const cap = '.unica-slider-thumb';
const label = '.unica-slider-mark-label';
const slider = (page) => page.getByRole('slider', { name: 'Exposure', exact: true });
const lower = (page) => page.getByRole('slider', { name: 'Minimum price' });
const upper = (page) => page.getByRole('slider', { name: 'Maximum price' });
const button = (page, name) => page.getByRole('button', { name, exact: true });
const log = async (page) => JSON.parse((await page.getByTestId('log').textContent()) || '[]');
const editMode = (page, mode) => page.getByLabel('Controlled owner').selectOption(mode);

async function position(widget, fraction, vertical = false) {
  return widget.locator(hit).evaluate(
    (track, { fraction, vertical, cap }) => {
      const box = track.getBoundingClientRect();
      const thumb = track.querySelector(cap).getBoundingClientRect();
      const width = vertical ? thumb.height : thumb.width;
      const offset = width / 2 + (vertical ? box.height - width : box.width - width) * fraction;
      const rtl = getComputedStyle(track).direction === 'rtl';
      return vertical
        ? [box.x + box.width / 2, box.y + box.height - offset]
        : [rtl ? box.x + box.width - offset : box.x + offset, box.y + box.height / 2];
    },
    { fraction, vertical, cap },
  );
}

async function capCenter(widget, thumb = 0) {
  return widget
    .locator(cap)
    .nth(thumb)
    .evaluate((node) => {
      const box = node.getBoundingClientRect();
      return [box.x + box.width / 2, box.y + box.height / 2];
    });
}

async function nativeEdit(element, edits) {
  await element.evaluate((input, edits) => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [type, value] of edits) {
      if (value !== null) {
        setValue.call(input, String(value));
      }
      input.dispatchEvent(new Event(type, { bubbles: true }));
    }
  }, edits);
}

async function snapshotForm(form, reset = false) {
  return form.evaluate((element, reset) => {
    if (reset) {
      element.reset();
    }
    let invalid = 0;
    let submit = 0;
    const submitted = [];
    const onInvalid = () => {
      invalid++;
    };
    const onSubmit = (event) => {
      event.preventDefault();
      submit++;
      submitted.push(...[...new FormData(element)].map(([key, value]) => [key, Number(value)]));
    };
    element.addEventListener('invalid', onInvalid, true);
    element.addEventListener('submit', onSubmit);
    element.requestSubmit();
    element.removeEventListener('invalid', onInvalid, true);
    element.removeEventListener('submit', onSubmit);
    const live = [...element.elements].filter(
      (node) => node.type === 'range' && !node.matches(':disabled'),
    );
    return {
      submitted,
      submit,
      invalid,
      fields: live.map((input) => [
        input.name,
        input.valueAsNumber,
        Number(input.step),
        input.validity.valid,
        input.validity.stepMismatch,
      ]),
    };
  }, reset);
}

async function values(page) {
  return [Number(await lower(page).inputValue()), Number(await upper(page).inputValue())];
}

export default {
  'Slider native SSR and hydration keep exact decimal submission, validation, and dynamic bounds':
    async ({ page, mount, renderFixture }) => {
      await mount('slider-hydration');
      const host = page.getByTestId('hydrate-sliders');
      const html = await renderFixture('slider-ssr');
      await host.evaluate((node, html) => {
        node.innerHTML = html;
      }, html);
      const grids = [
        [0.3, 0.9, 0.3],
        [-0.2, 0.3, 0.1],
        [3e-9, 4e-9, 1e-9],
        [999999.98, 999999.99, 0.01],
        [0, 1, 1],
        [1e300, 1e300, 1e-290],
      ];
      async function check(index, expected) {
        const [solo, low, high, step] = expected;
        const form = page.getByTestId(`numeric-${index}`);
        const submitted = [
          ['solo', solo],
          ['low', low],
          ['high', high],
        ];
        assert.deepEqual(await snapshotForm(form), {
          submitted,
          submit: 1,
          invalid: 0,
          fields: submitted.map(([name, value]) => [name, value, step, true, false]),
        });
      }
      for (const [index, [lo, hi, step]] of grids.entries()) {
        await check(index, [lo, lo, hi, step]);
      }
      await host.evaluate((node) => node.dispatchEvent(new Event('hydrate-sliders')));
      for (const [index, [lo, hi, step]] of grids.entries()) {
        const form = page.getByTestId(`numeric-${index}`);
        await check(index, [lo, lo, hi, step]);
        await form.getByRole('slider', { name: 'From' }).press('End');
        await check(index, [lo, hi, hi, step]);
        await snapshotForm(form, true);
        await check(index, [lo, lo, hi, step]);
      }
    },

  'Slider names, refs, RTL keys, native focus, read-only and fieldset availability': async ({
    page,
    mount,
  }) => {
    await mount('slider', { direction: 'rtl' });
    const scalar = slider(page);
    await page.locator('label[for="scalar"]').click();
    await assertFocused(scalar);
    assert.equal(await scalar.inputValue(), '20');
    await scalar.press('ArrowLeft');
    assert.equal(await scalar.inputValue(), '21');
    await scalar.press('PageUp');
    assert.equal(await scalar.inputValue(), '31');
    await scalar.press('Home');
    assert.equal(await scalar.inputValue(), '0');
    assert.equal(await scalar.getAttribute('aria-valuetext'), '0%');
    assert.equal(
      await page.getByRole('group', { name: 'Price window' }).getAttribute('aria-invalid'),
      'true',
    );
    assert.equal(await lower(page).getAttribute('aria-describedby'), 'low-help range-help');
    await lower(page).focus();
    await page.keyboard.press('Tab');
    await assertFocused(upper(page));
    await button(page, 'Focus upper ref').click();
    await assertFocused(upper(page));
    assert.equal(
      await page.getByRole('group', { name: 'Price window' }).getAttribute('data-group-ref'),
      '',
    );

    await button(page, 'Toggle axis').click();
    await scalar.press('ArrowRight');
    assert.equal(await scalar.inputValue(), '1');
    assert.equal(await scalar.getAttribute('aria-orientation'), 'vertical');
    await button(page, 'Toggle readonly').click();
    await scalar.press('End');
    await nativeEdit(scalar, [
      ['input', 80],
      ['change', null],
    ]);
    assert.equal(await scalar.inputValue(), '1');
    assert.equal(await scalar.getAttribute('aria-readonly'), 'true');
    assert.equal(await scalar.getAttribute('aria-invalid'), 'true');
    assert.deepEqual((await snapshotForm(page.locator('#first-form'))).submitted, [
      ['exposure', 1],
      ['legend', 50],
      ['price', 60],
      ['price', 80],
    ]);

    await button(page, 'Toggle disabled').click();
    const disabledInputs = page.locator(
      '#scalar:disabled, [data-testid=range] input[type=range]:disabled',
    );
    assert.equal(await disabledInputs.count(), 3);
    assert.equal(await scalar.getAttribute('aria-invalid'), null);
    await page.waitForFunction(
      () => !document.querySelector('[data-testid=range]').hasAttribute('aria-invalid'),
    );
    assert.deepEqual((await snapshotForm(page.locator('#first-form'))).submitted, [['legend', 50]]);
  },

  'Slider updates read-only and invalid semantics when initially disabled inputs are enabled':
    async ({ page, mount }) => {
      await mount('slider');
      const scalar = page.getByRole('slider', { name: 'Initially disabled value' });
      const group = page.getByRole('group', { name: 'Initially disabled bounds' });
      const handles = await group.getByRole('slider').all();
      assert.equal(await scalar.getAttribute('aria-invalid'), null);
      assert.equal(await group.getAttribute('aria-invalid'), null);
      await button(page, 'Enable standalone sliders').click();
      assert.equal(await scalar.getAttribute('aria-invalid'), 'true');
      assert.equal(await group.getAttribute('aria-invalid'), 'true');
      for (const input of [scalar, ...handles]) {
        assert.equal(await input.isDisabled(), false);
        assert.equal(await input.getAttribute('aria-readonly'), 'true');
      }
    },

  'Slider controlled proposals use synchronous owner authority for keys and fast pointer edits':
    async ({ page, mount }) => {
      await mount('slider');
      const scalar = slider(page);
      const widget = page.getByTestId('scalar');
      for (const [mode, final, kinds] of [
        ['refuse', 20, ['change']],
        ['replace', 49, ['change']],
        ['later', 21, ['change']],
        ['transition', 21, ['change']],
        ['nested', 21, ['change', 'commit']],
        ['accept', 21, ['change', 'commit']],
      ]) {
        await editMode(page, mode);
        await button(page, 'Set 20').click();
        await button(page, 'Clear log').click();
        await scalar.press('ArrowRight');
        await page.waitForFunction(
          (expected) => document.querySelector('#scalar').valueAsNumber === expected,
          final,
        );
        const events = await log(page);
        assert.deepEqual(
          events.map(({ kind }) => kind),
          kinds,
          mode,
        );
        assert.deepEqual(events[0].snapshot[0], ['exposure', '20'], mode);
        if (events.length > 1) {
          assert.deepEqual(events[1].snapshot[0], ['exposure', '21'], mode);
        }
      }
      assert.equal(await page.getByTestId('log').getAttribute('data-touched'), 'true');
      await button(page, 'Set 20').click();
      await button(page, 'Clear log').click();
      await page.mouse.move(...(await capCenter(widget)));
      await page.mouse.down();
      await page.mouse.move(...(await position(widget, 0.4)));
      await page.mouse.up();
      assert.equal(await scalar.inputValue(), '40');
      assert.deepEqual(
        (await log(page)).map(({ kind, value }) => [kind, value]),
        [
          ['change', 40],
          ['commit', 40],
        ],
      );
    },

  'Slider native input and change share one gesture even after the carrier repairs a rejected value':
    async ({ page, mount }) => {
      await mount('slider');
      const scalar = slider(page);
      await editMode(page, 'partial');
      await scalar.focus();
      await nativeEdit(scalar, [
        ['input', 21],
        ['input', 22],
        ['change', null],
      ]);
      assert.equal(await scalar.inputValue(), '21');
      assert.deepEqual(
        (await log(page)).map(({ kind, value }) => [kind, value]),
        [
          ['change', 21],
          ['change', 22],
          ['commit', 21],
        ],
      );

      await editMode(page, 'refuse');
      await button(page, 'Clear log').click();
      await nativeEdit(scalar, [
        ['input', 24],
        ['change', null],
      ]);
      assert.equal(await scalar.inputValue(), '21');
      assert.deepEqual(
        (await log(page)).map(({ kind, value }) => [kind, value]),
        [['change', 24]],
      );

      await editMode(page, 'accept');
      await button(page, 'Clear log').click();
      await scalar.focus();
      await nativeEdit(scalar, [['input', 25]]);
      await page.keyboard.press('Tab');
      await nativeEdit(scalar, [['change', 26]]);
      assert.equal(await scalar.inputValue(), '26');
      assert.deepEqual(
        (await log(page)).map(({ kind, value }) => [kind, value]),
        [
          ['change', 25],
          ['commit', 25],
          ['change', 26],
          ['commit', 26],
        ],
      );
    },

  'Slider distinguishes synchronous drag acceptance from late props without onValueCommit': async ({
    page,
    mount,
  }) => {
    await mount('slider');
    await button(page, 'Omit scalar commit callback').click();
    await editMode(page, 'later');
    const widget = page.getByTestId('scalar');
    const control = slider(page);
    await widget.locator(hit).scrollIntoViewIfNeeded();
    await page.mouse.move(...(await capCenter(widget)));
    await page.mouse.down();
    await page.mouse.move(...(await position(widget, 0.3)));
    await page.waitForFunction(() => document.querySelector('#scalar').valueAsNumber === 30);
    assert.equal(await widget.locator(hit).getAttribute('data-unica-slider-dragging'), null);
    await page.keyboard.press('Escape');
    await page.mouse.up();
    assert.equal(await control.inputValue(), '30');
    assert.deepEqual(
      (await log(page)).map(({ kind, value }) => [kind, value]),
      [['change', 30]],
    );

    await editMode(page, 'accept');
    await button(page, 'Clear log').click();
    await widget.locator(hit).scrollIntoViewIfNeeded();
    await page.mouse.move(...(await capCenter(widget)));
    await page.mouse.down();
    await page.mouse.move(...(await position(widget, 0.4)));
    assert.equal(await control.inputValue(), '40');
    assert.equal(await widget.locator(hit).getAttribute('data-unica-slider-dragging'), '');
    await page.keyboard.press('Escape');
    await page.mouse.up();
    assert.equal(await control.inputValue(), '30');
    assert.deepEqual(
      (await log(page)).map(({ kind, value }) => [kind, value]),
      [
        ['change', 40],
        ['change', 30],
      ],
    );
  },

  'Slider capture owns keys and native edits, Escape rolls back, and focus loss keeps the accepted edit':
    async ({ page, mount }) => {
      await mount('slider');
      const widget = page.getByTestId('scalar');
      const scalar = slider(page);
      await page.mouse.move(...(await capCenter(widget)));
      await page.mouse.down();
      await page.mouse.move(...(await position(widget, 0.3)));
      await page.keyboard.press('ArrowRight');
      await nativeEdit(scalar, [
        ['input', 60],
        ['change', null],
      ]);
      assert.equal(await scalar.inputValue(), '30');
      await page.keyboard.press('Escape');
      await page.mouse.up();
      assert.equal(await scalar.inputValue(), '20');
      await scalar.press('ArrowRight');
      assert.equal(await scalar.inputValue(), '21');
      assert.deepEqual(
        (await log(page)).map(({ kind, value }) => [kind, value]),
        [
          ['change', 30],
          ['change', 20],
          ['change', 21],
          ['commit', 21],
        ],
      );

      await button(page, 'Clear log').click();
      await page.mouse.move(...(await capCenter(widget)));
      await page.mouse.down();
      await page.mouse.move(...(await position(widget, 0.7)));
      await page.keyboard.press('Tab');
      await page.mouse.move(...(await position(widget, 0.9)));
      await page.mouse.up();
      assert.equal(await scalar.inputValue(), '70');
      assert.deepEqual(
        (await log(page)).map(({ kind, value }) => [kind, value]),
        [['change', 70]],
      );
    },

  'Slider completes a native input when its controlled change callback moves focus': async ({
    page,
    mount,
  }) => {
    await mount('slider');
    await editMode(page, 'blur');
    const control = slider(page);
    await control.focus();
    await nativeEdit(control, [
      ['input', 21],
      ['change', null],
    ]);
    await assertFocused(button(page, 'Reset first'));
    assert.equal(await control.inputValue(), '21');
    assert.deepEqual(
      (await log(page)).map(({ kind, value }) => [kind, value]),
      [
        ['change', 21],
        ['commit', 21],
      ],
    );
  },

  'RangeSlider rail taps open either end of a collapsed range and preserve placement under half zoom':
    async ({ page, mount }) => {
      await mount('slider');
      const range = page.getByTestId('range');
      const scalar = page.getByTestId('scalar');
      await button(page, 'Toggle collapsed range').click();
      const [left, right] = await Promise.all([capCenter(range, 0), capCenter(range, 1)]);
      assert.ok(Math.abs(left[0] - right[0]) < 0.1);
      assert.ok(right[1] - left[1] >= 15);
      await page.mouse.click(...(await position(range, 0.5)));
      assert.deepEqual(await values(page), [50, 50]);
      await page.mouse.click(...(await position(range, 0.25)));
      assert.deepEqual(await values(page), [25, 50]);
      await assertFocused(lower(page));
      await lower(page).press('End');
      await page.mouse.click(...(await position(range, 0.75)));
      assert.deepEqual(await values(page), [50, 75]);
      await assertFocused(upper(page));

      for (const zoom of [false, true]) {
        if (zoom) {
          await button(page, 'Toggle zoom').click();
        }
        await page.mouse.click(...(await position(scalar, 0.85)));
        const submitted = (await snapshotForm(page.locator('#first-form'))).submitted;
        assert.deepEqual(submitted[0], ['exposure', 85], `form data with zoom ${zoom}`);
        const [actualX] = await capCenter(scalar);
        const [expectedX] = await position(scalar, 0.85);
        assert.ok(
          Math.abs(actualX - expectedX) <= 0.75,
          `cap at ${actualX}, expected ${expectedX}`,
        );
      }
    },

  'RangeSlider reset submits immediately in either direction and when a handler moves the form owner':
    async ({ page, mount }) => {
      await mount('slider');
      const a = page.locator('#first-form');
      const b = page.locator('#second-form');
      const range = page.getByTestId('range');
      await lower(page).press('Home');
      await upper(page).press('Home');
      assert.deepEqual(await values(page), [0, 0]);
      assert.deepEqual((await snapshotForm(a, true)).submitted.slice(-2), [
        ['price', 60],
        ['price', 80],
      ]);
      await upper(page).press('End');
      await lower(page).press('End');
      assert.deepEqual(await values(page), [100, 100]);
      assert.deepEqual((await snapshotForm(a, true)).submitted.slice(-2), [
        ['price', 60],
        ['price', 80],
      ]);

      await lower(page).press('Home');
      await upper(page).press('Home');
      await button(page, 'Clear log').click();
      await b.evaluate((form) => {
        form.dataset.adopt = 'true';
      });
      assert.deepEqual((await snapshotForm(b, true)).submitted, [
        ['price', 60],
        ['price', 80],
      ]);
      assert.deepEqual(await values(page), [60, 80]);
      await page.waitForFunction(
        () => document.querySelector('input[aria-label="Maximum price"]').min === '60',
      );
      assert.equal(await lower(page).getAttribute('max'), '80');
      assert.deepEqual(await log(page), []);

      await lower(page).press('Home');
      await upper(page).press('Home');
      await b.evaluate((form) => {
        form.addEventListener('reset', (event) => event.preventDefault(), {
          capture: true,
          once: true,
        });
        form.reset();
        form.dispatchEvent(new Event('reset', { bubbles: true }));
      });
      assert.deepEqual((await snapshotForm(b)).submitted, [
        ['price', 0],
        ['price', 0],
      ]);
      await b.evaluate((form) => {
        form.reset();
        form.reset();
      });
      assert.deepEqual((await snapshotForm(b)).submitted, [
        ['price', 60],
        ['price', 80],
      ]);
      await page.waitForFunction(
        () => document.querySelector('input[aria-label="Maximum price"]').min === '60',
      );

      await button(page, 'Toggle range bound').click();
      assert.deepEqual(await values(page), [30, 30]);
      await button(page, 'Toggle range bound').click();
      assert.deepEqual(await values(page), [30, 30]);
      await button(page, 'Reset second').click();
      assert.deepEqual(await values(page), [60, 80]);
      await range.locator(hit).scrollIntoViewIfNeeded();
    },

  'RangeSlider settles a finished reset before completing, moving, or starting an edit': async ({
    page,
    mount,
  }) => {
    await mount('slider');
    const form = page.locator('#first-form');
    await button(page, 'Reset during each range edit').click();
    await lower(page).press('ArrowRight');
    assert.deepEqual(await values(page), [60, 80]);
    assert.deepEqual(
      (await log(page)).map(({ kind, value }) => [kind, value]),
      [['range change', [61, 80]]],
    );
    await button(page, 'Reset during each range edit').click();
    await lower(page).press('Home');
    await upper(page).press('Home');
    assert.deepEqual(await values(page), [0, 0]);
    const moved = await form.evaluate((node) => {
      node.reset();
      document.querySelector('#owner').click();
      return new FormData(document.querySelector('#second-form')).getAll('price');
    });
    assert.deepEqual(moved, ['60', '80']);
    assert.deepEqual(await values(page), [60, 80]);
    await button(page, 'Toggle range form').click();
    await lower(page).press('Home');
    await upper(page).press('Home');
    const sameStackEdit = await form.evaluate((node) => {
      node.reset();
      const lower = node.elements.namedItem('price')[0];
      lower.value = '59';
      lower.dispatchEvent(new Event('input', { bubbles: true }));
      lower.dispatchEvent(new Event('change', { bubbles: true }));
      return new FormData(node).getAll('price');
    });
    assert.deepEqual(sameStackEdit, ['59', '80']);
    assert.deepEqual(
      (await log(page)).slice(-2).map(({ kind, value }) => [kind, value]),
      [
        ['range change', [59, 80]],
        ['range commit', [59, 80]],
      ],
    );
    await lower(page).press('Home');
    await upper(page).press('Home');
    const shrunk = await form.evaluate((node) => {
      node.reset();
      document.querySelector('#range-bound').click();
      return new FormData(node).getAll('price');
    });
    assert.deepEqual(shrunk, ['30', '30']);
    assert.deepEqual(await values(page), [30, 30]);
  },

  'Slider and RangeSlider retain a native reset when live values change before it settles': async ({
    page,
    mount,
  }) => {
    await mount('slider');
    const form = page.locator('#first-form');
    await lower(page).press('Home');
    await upper(page).press('Home');
    await button(page, 'Clear log').click();
    await nativeEdit(upper(page), [['input', 1]]);
    const range = await form.evaluate((node) => {
      const [lower, upper] = node.elements.namedItem('price');
      const current = () => new FormData(node).getAll('price');
      node.reset();
      const afterReset = current();
      lower.value = '40';
      upper.value = '50';
      upper.dispatchEvent(new Event('change', { bubbles: true }));
      return [afterReset, current()];
    });
    assert.deepEqual(range, [
      ['60', '80'],
      ['60', '80'],
    ]);
    assert.deepEqual(
      (await log(page)).map(({ kind, value }) => [kind, value]),
      [['range change', [0, 1]]],
    );

    await page.getByRole('slider', { name: 'Legend control' }).press('Home');
    const scalar = await form.evaluate((node) => {
      const control = node.elements.namedItem('legend');
      node.reset();
      control.value = '40';
      control.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
      return new FormData(node).get('legend');
    });
    assert.equal(scalar, '51');
  },

  'RangeSlider uses the current grid when a key finishes a native edit whose commit changed step':
    async ({ page, mount }) => {
      await mount('slider');
      await button(page, 'Use coarse step after a commit').click();
      await lower(page).focus();
      await nativeEdit(lower(page), [['input', 61]]);
      await page.keyboard.press('ArrowRight');
      assert.deepEqual(await values(page), [70, 80]);
      assert.deepEqual(
        (await log(page)).map(({ kind, value }) => [kind, value]),
        [
          ['range change', [61, 80]],
          ['range commit', [61, 80]],
          ['range change', [70, 80]],
          ['range commit', [70, 80]],
        ],
      );
    },

  'RangeSlider settles a reset triggered by focus or by the previous native commit': async ({
    page,
    mount,
  }) => {
    await mount('slider');
    const widget = page.getByTestId('range');
    await lower(page).press('Home');
    await button(page, 'Reset when lower thumb gets focus').click();
    await button(page, 'Clear log').click();
    await widget.locator(hit).scrollIntoViewIfNeeded();
    await page.mouse.click(...(await position(widget, 0.25)));
    assert.deepEqual(await values(page), [60, 80]);
    assert.deepEqual(await log(page), []);

    // A shared rail point initially focuses upper. Moving toward lower shifts
    // focus again and can complete a reset before that drag proposes a value.
    await upper(page).press('Home');
    assert.deepEqual(await values(page), [60, 60]);
    await button(page, 'Clear log').click();
    await widget.locator(hit).scrollIntoViewIfNeeded();
    await page.mouse.move(...(await position(widget, 0.6)));
    await page.mouse.down();
    await page.mouse.move(...(await position(widget, 0.5)));
    await page.mouse.up();
    assert.deepEqual(await values(page), [60, 80]);
    assert.deepEqual(await log(page), []);

    await button(page, 'Reset when lower thumb gets focus').click();
    await button(page, 'Reset after the next range commit').click();
    await lower(page).focus();
    await nativeEdit(lower(page), [['input', 61]]);
    await page.keyboard.press('ArrowRight');
    assert.deepEqual(await values(page), [61, 80]);
    assert.deepEqual(
      (await log(page)).map(({ kind, value }) => [kind, value]),
      [
        ['range change', [61, 80]],
        ['range commit', [61, 80]],
        ['range change', [61, 80]],
        ['range commit', [61, 80]],
      ],
    );
  },

  'RangeSlider keeps both long edge labels and ticks readable after narrow and vertical resize':
    async ({ page, mount }) => {
      await mount('slider', {
        direction: 'rtl',
        theme: 'frost-dark',
        surface: 'overlay',
        textScale: 120,
        forcedColors: 'active',
        reducedMotion: 'reduce',
      });
      const range = page.getByTestId('range');
      await button(page, 'Toggle narrow').click();
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('[data-testid=range] .unica-slider-mark-label'))
            .width !== '',
      );
      const labels = range.locator(label);
      const first = await labels.first().boundingBox();
      const last = await labels.last().boundingBox();
      const box = await range.boundingBox();
      assert.ok(first.x >= box.x - 1 && first.x + first.width <= box.x + box.width + 1);
      assert.ok(last.x >= box.x - 1 && last.x + last.width <= box.x + box.width + 1);
      assert.ok(last.y >= first.y + first.height || last.x + last.width <= first.x);
      await page.evaluate(() => {
        document.documentElement.dir = 'ltr';
      });
      const mirrored = await range.boundingBox();
      assert.equal(mirrored.width, box.width);
      for (const edge of [labels.first(), labels.last()]) {
        const current = await edge.boundingBox();
        assert.ok(
          current.x >= mirrored.x - 1 &&
            current.x + current.width <= mirrored.x + mirrored.width + 1,
        );
      }
      assert.equal(await range.locator('.unica-slider-tick').count(), 5);
      await lower(page).focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      assert.equal(
        await range
          .locator(cap)
          .first()
          .evaluate((node) => getComputedStyle(node).outlineStyle),
        'solid',
      );
      assert.equal(
        await range
          .locator(cap)
          .first()
          .evaluate((node) => getComputedStyle(node).transitionProperty),
        'none',
      );
      if (await page.evaluate(() => matchMedia('(forced-colors: active)').matches)) {
        const neutral = page.locator('legend .unica-slider');
        await neutral.locator(hit).scrollIntoViewIfNeeded();
        await page.mouse.move(...(await capCenter(neutral)));
        const colors = await neutral.locator(cap).evaluate((node) => {
          const swatch = document.createElement('span');
          swatch.style.forcedColorAdjust = 'none';
          swatch.style.color = 'Canvas';
          document.body.append(swatch);
          const result = [getComputedStyle(node).borderTopColor, getComputedStyle(swatch).color];
          swatch.remove();
          return result;
        });
        assert.equal(colors[0], colors[1]);
      }
      await button(page, 'Toggle axis').click();
      const bottomLabel = await labels.first().boundingBox();
      const topLabel = await labels.last().boundingBox();
      assert.ok(topLabel.y + topLabel.height <= bottomLabel.y + 1);
      await range.locator(hit).scrollIntoViewIfNeeded();
      await page.mouse.click(...(await position(range, 0.95, true)));
      assert.equal(Number(await upper(page).inputValue()), 95);
    },
  'Chromium Slider yields the captured touch to pinch zoom without committing an edit': async ({
    page,
    mount,
  }) => {
    await mount('slider');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 480,
      height: 740,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
    await page.evaluate(() => {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      document.head.append(viewport);
    });

    async function send(type, coords) {
      await cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: coords.map(([x, y], id) => ({ x, y, id })),
      });
    }

    const widget = page.getByTestId('scalar');
    for (const vertical of [false, true]) {
      if (vertical) {
        await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
        await page.waitForFunction(() => visualViewport.scale < 1.01);
        await button(page, 'Toggle axis').evaluate((node) => node.click());
        await button(page, 'Clear log').evaluate((node) => node.click());
        await page.waitForFunction(
          () => document.querySelector('#scalar').getAttribute('aria-orientation') === 'vertical',
        );
      }
      await widget.evaluate((node) => node.scrollIntoView({ block: 'center' }));
      const start = await position(widget, 0.35, vertical);
      const [x, y] = start;
      await send('touchStart', [start]);
      assert.equal(await slider(page).inputValue(), '35');
      const another = [x + 60, y + 45];
      await send('touchStart', [start, another]);
      for (const offset of [12, 30, 50]) {
        await send('touchMove', [
          [x - offset, y],
          [another[0] + offset, another[1] + offset],
        ]);
      }
      await page.waitForFunction(() => visualViewport.scale > 1.05);
      await send('touchEnd', []);
      assert.equal(await slider(page).inputValue(), '20');
      const actions = await log(page);
      assert.ok(actions.every(({ kind }) => kind === 'change'));
      assert.equal(actions[0].value, 35);
      assert.equal(actions.at(-1).value, 20);
    }
    await cdp.detach();
  },
};
