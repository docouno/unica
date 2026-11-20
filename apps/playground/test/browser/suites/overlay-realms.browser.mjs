import assert from 'node:assert/strict';

async function dispatch(page, event) {
  await page.locator('#overlay-realms').dispatchEvent(event);
}

export default {
  'same-version modules share one stack while an iframe has its own runtime': async ({
    page,
    mount,
  }) => {
    await mount('overlay-realms');
    await dispatch(page, 'open-copies');
    const fixture = page.locator('#overlay-realms');
    const first = page.locator('#first-copy');
    const second = page.locator('#second-copy');
    const iframe = page.frameLocator('iframe').locator('#iframe-copy');
    await second.waitFor();
    assert.equal(await fixture.getAttribute('data-distinct-modules'), 'true');
    assert.equal(await fixture.getAttribute('data-version-warnings'), '1');
    assert.equal(await fixture.getAttribute('data-main-runtime-keys'), '2');
    await page.keyboard.press('Escape');
    assert.equal(await second.getAttribute('data-requests'), '1');
    assert.equal(await first.getAttribute('data-requests'), null);
    assert.equal(await iframe.isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await first.getAttribute('data-requests'), '1');
    assert.equal(await iframe.isVisible(), true);
    await dispatch(page, 'check-cleanup');
    assert.equal(await fixture.getAttribute('data-main-runtime-keys'), '1');
    assert.equal(await fixture.getAttribute('data-remaining-versions'), 'earlier-version');
    await iframe.getByRole('button').press('Escape');
    assert.equal(await iframe.getAttribute('data-requests'), '1');
    assert.equal(
      await iframe.evaluate(
        (element) =>
          Object.getOwnPropertySymbols(element.ownerDocument.defaultView).filter((key) =>
            Symbol.keyFor(key)?.startsWith('@docouno/unica'),
          ).length,
      ),
      0,
    );
  },

  'a dialog in a shadow root loses ownership when its host is removed': async ({ page, mount }) => {
    await mount('overlay-realms');
    await dispatch(page, 'open-shadow');
    assert.equal(
      await page.locator('#overlay-realms').getAttribute('data-shadow-projection'),
      'true',
    );
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    await dispatch(page, 'remove-shadow');
    await page.waitForFunction(() => document.documentElement.style.overflow === '');
    await dispatch(page, 'check-shadow');
    assert.equal(
      await page.locator('#overlay-realms').getAttribute('data-shadow-projection'),
      'false',
    );
  },
  'a state-preserving dialog move updates scoped hosts and observes the new ancestor': async ({
    page,
    mount,
  }) => {
    await mount('overlay-realms');
    await dispatch(page, 'move-owned-dialog');
    const fixture = page.locator('#overlay-realms');
    assert.equal(await fixture.getAttribute('data-preserved-modal'), 'true');
    assert.equal(await fixture.getAttribute('data-modal-host'), 'moved-dialog');
    assert.equal(await fixture.getAttribute('data-hosts-before-move'), 'moved-dialog|none');
    await page.waitForFunction(
      () => document.querySelector('#overlay-realms').dataset.scopedHosts === 'none|moved-dialog',
    );
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
    await dispatch(page, 'remove-moved-dialog');
    await page.waitForFunction(() => document.documentElement.style.overflow === '');
    assert.equal(await fixture.getAttribute('data-modal-host'), 'body');
  },

  'slot reassignment updates the modal scope with the same native dialog and scroll lock': async ({
    page,
    mount,
  }) => {
    await mount('overlay-realms');
    const hosts = (scopes) =>
      page.waitForFunction(
        (value) => document.querySelector('#overlay-realms').dataset.scopedHosts === value,
        scopes,
      );
    await dispatch(page, 'open-slotted-dialog');
    await hosts('slotted-dialog|none');
    await dispatch(page, 'reassign-dialog-slot');
    await hosts('none|slotted-dialog');
    await dispatch(page, 'rename-dialog-slot');
    await hosts('none|none');
    await dispatch(page, 'rename-dialog-slot');
    await hosts('none|slotted-dialog');
    assert.equal(
      await page.locator('#slotted-dialog').evaluate((dialog) => dialog.matches(':modal')),
      true,
    );
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden');
  },

  'a previous document releases an adopted carrier without closing it in the new document': async ({
    page,
    mount,
  }) => {
    await mount('overlay-realms');
    await dispatch(page, 'adopt-popover');
    await page.waitForFunction(
      () => document.querySelector('#overlay-realms').dataset.oldOwnerDismiss === 'lost',
    );
    const fixture = page.locator('#overlay-realms');
    const adopted = page.frameLocator('iframe').locator('#adopted');
    assert.equal(await adopted.evaluate((element) => element.matches(':popover-open')), true);
    assert.equal(await fixture.getAttribute('data-new-owner-dismiss'), null);
    await adopted.getByRole('button').press('Escape');
    assert.equal(await fixture.getAttribute('data-new-owner-dismiss'), 'escape');
    assert.equal(await adopted.evaluate((element) => element.matches(':popover-open')), false);
  },
};
