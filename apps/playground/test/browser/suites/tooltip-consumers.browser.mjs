import assert from 'node:assert/strict';
import { assertFocused, getBox } from '../helpers.mjs';

const dateTooltip = '.calendar-date-feedback:popover-open';

function center(box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function moveTo(page, locator) {
  const point = center(await getBox(locator));
  await page.mouse.move(point.x, point.y);
}

async function tap(session, locator) {
  const point = center(await getBox(locator));
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

export default {
  'Calendar Escape closes the date reason before its live picker': async ({ page, mount }) => {
    await mount('tooltip-consumers');
    const input = page.getByRole('textbox', { name: 'Review date' });
    await input.press('Alt+ArrowDown');
    await page.waitForFunction(() => document.activeElement?.dataset.date === '2026-09-14');
    const panel = page.locator('.date-picker-panel-proto:popover-open');
    const unavailable = panel.getByRole('button', { name: /19 Sept 2026.*unavailable/ });
    await unavailable.focus();
    await assertFocused(unavailable);
    assert.equal(await unavailable.getAttribute('aria-describedby'), null);
    const tip = page.locator(dateTooltip);
    assert.equal(await tip.textContent(), '19 Sept 2026 is unavailable');

    await page.keyboard.press('Escape');
    await tip.waitFor({ state: 'detached' });
    assert.equal(await panel.count(), 1);
    await assertFocused(unavailable);
    assert.equal(await panel.locator('.calendar-date-feedback').count(), 1);

    await page.keyboard.press('Escape');
    await panel.waitFor({ state: 'detached' });
    await assertFocused(page.getByRole('button', { name: 'Select date' }));
    assert.equal(await input.inputValue(), '14/09/2026');
  },

  'Calendar retains a rejected tap, allows slow inspection, then restores its saved reason':
    async ({ page, mount }) => {
      await mount('tooltip-consumers');
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      await tap(session, page.getByRole('button', { name: 'Select date' }));
      const panel = page.locator('.date-picker-panel-proto:popover-open');
      const grid = panel.getByRole('grid');
      const gridBefore = await getBox(grid);
      const first = panel.getByRole('button', { name: /19 Sept 2026.*unavailable/ });
      const second = panel.getByRole('button', { name: /05 Sept 2026.*unavailable/ });
      await tap(session, first);

      const retained = page.locator(`${dateTooltip}[data-side]`).filter({ hasText: '19 Sept' });
      await retained.waitFor({ state: 'visible' });
      const native = await retained.evaluateHandle((carrier) => {
        const transitions = [];
        const retargets = [];
        let text = carrier.textContent;
        const observer = new MutationObserver(() => {
          if (carrier.textContent === text) {
            return;
          }
          text = carrier.textContent;
          // Sample after the React commit, before the new anchor's asynchronous
          // intersection result. The last placement must still be visible.
          const box = carrier.getBoundingClientRect();
          retargets.push({
            text,
            positioned:
              carrier.matches(':popover-open[data-side][data-align]') &&
              getComputedStyle(carrier).visibility === 'visible' &&
              (box.x !== 0 || box.y !== 0),
          });
        });
        observer.observe(carrier, { characterData: true, childList: true, subtree: true });
        carrier.addEventListener('beforetoggle', (event) => transitions.push(event.newState));
        return { carrier, transitions, retargets, observer };
      });
      assert.deepEqual(await getBox(grid), gridBefore);
      const area = await getBox(panel);
      const saved = await getBox(retained);
      assert.ok(
        saved.x + saved.width <= area.x ||
          saved.x >= area.x + area.width ||
          saved.y + saved.height <= area.y ||
          saved.y >= area.y + area.height,
        'The retained reason sits outside the picker when there is room',
      );
      const input = page.getByRole('textbox', { name: 'Review date' });
      assert.equal(await input.inputValue(), '14/09/2026');
      await tap(session, grid.getByRole('columnheader', { name: 'Monday' }));
      assert.equal(await retained.count(), 1);

      await session.send('Emulation.setTouchEmulationEnabled', { enabled: false });
      await moveTo(page, second);
      const inspecting = page
        .locator(`${dateTooltip}[data-side="top"]`)
        .filter({ hasText: '5 Sept' });
      await inspecting.waitFor({ state: 'visible' });
      const day = await getBox(second);
      await page.waitForFunction((anchorTop) => {
        const surface = document.querySelector(
          '.calendar-date-feedback:popover-open[data-side="top"]',
        );
        return surface && Math.abs(anchorTop - surface.getBoundingClientRect().bottom - 8) < 1;
      }, day.y);
      assert.equal(
        await inspecting.evaluate((element, observed) => element === observed.carrier, native),
        true,
      );
      const reading = await getBox(inspecting);
      const neighbor = panel.getByRole('button', { name: /04 Sept 2026/ });
      assert.equal(
        await neighbor.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return element.contains(
            document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2),
          );
        }),
        true,
        'The bridge leaves the adjacent date available',
      );

      const x = day.x + day.width / 2;
      await page.mouse.move(x, (day.y + reading.y + reading.height) / 2);
      await page.waitForTimeout(220);
      assert.equal(await inspecting.count(), 1);
      await page.mouse.move(x, reading.y + reading.height - 4);
      await page.waitForTimeout(220);
      assert.equal(await inspecting.count(), 1);
      await page.mouse.move(5, 5);
      await retained.waitFor({ state: 'visible' });
      assert.deepEqual(
        await retained.evaluate((element, observed) => {
          observed.observer.disconnect();
          return {
            sameCarrier: element === observed.carrier,
            transitions: observed.transitions,
            retargets: observed.retargets,
          };
        }, native),
        {
          sameCarrier: true,
          transitions: [],
          retargets: [
            { text: '05 Sept 2026 is unavailable', positioned: true },
            { text: '19 Sept 2026 is unavailable', positioned: true },
          ],
        },
      );

      await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      // Coarse-pointer layout changes the grid and moves its retained reason.
      // Tap once the reason is back at its touch placement.
      await page.waitForFunction((expected) => {
        const surface = document.querySelector('.calendar-date-feedback:popover-open[data-side]');
        if (!surface || surface.style.getPropertyValue('--_overlay-bridge-content')) {
          return false;
        }
        const bounds = surface.getBoundingClientRect();
        return (
          matchMedia('(pointer: coarse)').matches &&
          Math.abs(bounds.x - expected.x) < 1 &&
          Math.abs(bounds.y - expected.y) < 1 &&
          surface.contains(
            document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2),
          )
        );
      }, saved);
      await tap(session, retained);
      await retained.waitFor({ state: 'detached' });
      assert.deepEqual(await native.evaluate((observed) => observed.transitions), ['closed']);
      await native.dispose();
      assert.equal(await input.inputValue(), '14/09/2026');
      assert.equal(await panel.count(), 1);

      await tap(session, panel.getByRole('button', { name: /22 Sept 2026/ }));
      await panel.waitFor({ state: 'detached' });
      assert.equal(await input.inputValue(), '22/09/2026');
      assert.equal(await page.locator(dateTooltip).count(), 0);
    },

  'Avatar names are cold per group and warm between members without moving the stack': async ({
    page,
    mount,
  }) => {
    await mount('tooltip-consumers', { direction: 'rtl' });
    const designer = page.getByRole('img', { name: 'Design reviewer' });
    const editor = page.getByRole('img', { name: 'Content reviewer' });
    const writer = page.getByRole('img', { name: 'Workspace writer' });
    const originalDesigner = await getBox(designer);
    const originalEditor = await getBox(editor);
    await page.clock.install({ time: new Date('2026-09-16T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-16T12:00:01Z'));
    const hint = page.locator('.unica-tooltip:popover-open');

    await moveTo(page, designer);
    await page.clock.runFor(299);
    assert.equal(await hint.count(), 0);
    await page.clock.runFor(1);
    assert.equal(await hint.textContent(), 'Design reviewer');
    assert.equal(await designer.getAttribute('aria-describedby'), null);

    await moveTo(page, editor);
    await page.clock.runFor(1);
    assert.equal(await hint.textContent(), 'Content reviewer');
    assert.deepEqual(await getBox(designer), originalDesigner);
    assert.deepEqual(await getBox(editor), originalEditor);

    await moveTo(page, writer);
    await page.clock.runFor(299);
    assert.equal(await hint.count(), 0);
    await page.clock.runFor(1);
    assert.equal(await hint.textContent(), 'Workspace writer');

    await page.keyboard.press('Escape');
    assert.equal(await hint.count(), 0);
    await page.clock.runFor(600);
    assert.equal(await hint.count(), 0);
  },
};
