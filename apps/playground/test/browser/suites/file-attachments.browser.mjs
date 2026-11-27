import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assertFocused, getBox } from '../helpers.mjs';

const root = '#attachment-owner';
const other = '#external-owner';
const sourceFile = fileURLToPath(new URL('../../../../../docs/anatomy.md', import.meta.url));
const author = (page) => page.getByTestId('compact');
const picker = (page) => author(page).getByRole('button', { name: 'Choose file Mapping schema' });
const compact = (page) => author(page).locator('input[type=file][name]');
const well = (page) => page.locator('#bundle');
const wellRoot = (page) => page.getByTestId('well');
const live = (component) => component.getByRole('status').last();
const button = (page, name) => page.getByRole('button', { name, exact: true });
const upload = (name, contents = name, lastModified = 1, type = 'text/markdown') => ({
  name,
  contents,
  lastModified,
  type,
});

async function readEntries(form, key) {
  return form.evaluate(
    async (owner, name) =>
      Promise.all(
        new FormData(owner).getAll(name).map(async (value) =>
          typeof value === 'string'
            ? value
            : {
                name: value.name,
                type: value.type,
                lastModified: value.lastModified,
                bytes: Array.from(new Uint8Array(await value.arrayBuffer())),
              },
        ),
      ),
    key,
  );
}

async function eventLog(page, count) {
  await page.waitForFunction(
    (size) =>
      JSON.parse(document.querySelector('[data-testid=events]').textContent).length === size,
    count,
  );
  return JSON.parse(await page.getByTestId('events').textContent());
}

async function transfer(target, files, event = 'drop', text) {
  return target.evaluate(
    (node, args) => {
      const data = new DataTransfer();
      for (const { name, contents, lastModified, type } of args.files) {
        data.items.add(new File([contents], name, { lastModified, type }));
      }
      if (args.text) {
        data.setData('text/plain', args.text);
      }
      const init = { bubbles: true, cancelable: true };
      const synthetic =
        args.event === 'paste'
          ? new ClipboardEvent('paste', { ...init, clipboardData: data })
          : new DragEvent(args.event, { ...init, dataTransfer: data });
      return node.dispatchEvent(synthetic);
    },
    { files, event, text },
  );
}

async function choose(page, activate, files) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), activate()]);
  await chooser.setFiles(files);
}

async function trustedDrop(page, input, path) {
  await input.scrollIntoViewIfNeeded();
  const box = await getBox(input);
  const client = await page.context().newCDPSession(page);
  try {
    const event = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      data: { files: [path], items: [], dragOperationsMask: 1 },
    };
    for (const type of ['dragEnter', 'dragOver', 'drop']) {
      await client.send('Input.dispatchDragEvent', { ...event, type });
    }
  } finally {
    await client.detach();
  }
}

async function settle(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

export default {
  'File attachments keep picker candidates separate and submit the original multipart bytes':
    async ({ page, mount }) => {
      await mount('file-attachments');
      const form = page.locator(root);
      assert.equal(await form.evaluate((owner) => owner.checkValidity()), false);
      assert.equal(await compact(page).evaluate((node) => node === document.activeElement), false);
      await form.evaluate((owner) => owner.reportValidity());
      await assertFocused(picker(page));
      await page.keyboard.press('Escape');
      assert.deepEqual(
        (await readEntries(form, 'schema')).map(({ name, bytes }) => [name, bytes]),
        [['', []]],
      );

      await choose(
        page,
        () => form.locator('label').filter({ hasText: 'Mapping schema' }).click(),
        sourceFile,
      );
      const first = (await readEntries(form, 'schema'))[0];
      assert.equal(first.name, 'anatomy.md');
      assert.deepEqual(first.bytes, Array.from(await readFile(sourceFile)));
      await eventLog(page, 2);
      assert.equal(await form.evaluate((owner) => owner.checkValidity()), true);

      const pending = page.waitForEvent('filechooser');
      await picker(page).press('Space');
      const replacement = await pending;
      assert.deepEqual(await readEntries(form, 'schema'), [first]);
      await replacement.setFiles({
        name: 'wrong.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('bad bytes'),
      });
      const reported = await eventLog(page, 3);
      assert.deepEqual(reported.at(-1), [
        'compact-intake',
        { source: 'picker', accepted: [], rejected: [['wrong.txt', 'type']] },
        ['anatomy.md'],
      ]);
      assert.deepEqual(await readEntries(form, 'schema'), [first]);
      assert.equal(await form.evaluate((owner) => owner.checkValidity()), true);
      const [canceled] = await Promise.all([
        page.waitForEvent('filechooser'),
        picker(page).press('Enter'),
      ]);
      await canceled.element().dispatchEvent('cancel', { bubbles: true });
      await choose(page, () => picker(page).press('Enter'), sourceFile);
      await settle(page);
      assert.deepEqual(await eventLog(page, 3), reported);
      assert.deepEqual(await readEntries(form, 'schema'), [first]);

      // Capture the native request at the receiving HTTP server. DevTools
      // request metadata can omit the contents of disk-backed multipart files.
      const receiver = createServer();
      receiver.listen(0, '127.0.0.1');
      await once(receiver, 'listening');
      try {
        const { port } = receiver.address();
        await form.evaluate((owner, url) => {
          owner.action = url;
        }, `http://127.0.0.1:${port}/attachments`);
        const request = once(receiver, 'request');
        await button(page, 'Submit attachments').click({ noWaitAfter: true });
        const [message, reply] = await request;
        const chunks = [];
        for await (const chunk of message) {
          chunks.push(chunk);
        }
        reply.writeHead(200, { 'Content-Type': 'text/html' });
        reply.end('<title>Receipt</title>');
        assert.equal(message.method, 'POST');
        const incoming = await new Response(Buffer.concat(chunks), {
          headers: { 'Content-Type': message.headers['content-type'] },
        }).formData();
        assert.equal(incoming.get('schema').name, first.name);
        assert.ok(
          Buffer.from(await incoming.get('schema').arrayBuffer()).equals(Buffer.from(first.bytes)),
        );
        assert.equal(incoming.getAll('uploads')[0], 'same-name control');
        assert.equal(await incoming.getAll('uploads')[1].text(), 'verified content');
      } finally {
        receiver.close();
      }
    },

  'File attachments admit mixed batches, count raw entries and settle controlled feedback at commit':
    async ({ page, mount }) => {
      await mount('file-attachments');
      const form = page.locator(root);
      const log = async (count) => (await eventLog(page, count)).slice(-2);
      const snapshot = async () =>
        (await readEntries(form, 'uploads')).map((entry) =>
          typeof entry === 'string' ? entry : entry.name,
        );
      assert.deepEqual(await snapshot(), ['same-name control', 'base.md']);
      assert.deepEqual(
        await wellRoot(page).getByText('Author description.', { exact: true }).count(),
        1,
      );
      const description = await well(page).evaluate((node) =>
        node
          .getAttribute('aria-describedby')
          .split(' ')
          .map((id) => document.getElementById(id).textContent)
          .join(' '),
      );
      assert.match(description, /Author description.*[.]md, [.]zip.*50[.]0 KB each.*3 files max/);

      const mixed = [upload('بحث.txt'), upload('a.md', 'accepted')];
      await page.getByLabel('Authority').selectOption('veto');
      assert.equal(await transfer(well(page), mixed), false);
      const veto = await log(2);
      assert.deepEqual(veto, [
        ['well-value', ['base.md', 'a.md'], ['base.md']],
        [
          'well-intake',
          { source: 'drop', accepted: ['a.md'], rejected: [['بحث.txt', 'type']] },
          ['base.md'],
        ],
      ]);
      await live(wellRoot(page)).filter({ hasText: 'Your selection is unchanged.' }).waitFor();
      assert.match(await live(wellRoot(page)).textContent(), /\u2068بحث[.]txt\u2069/);
      assert.deepEqual(await snapshot(), ['same-name control', 'base.md']);

      await page.getByLabel('Authority').selectOption('accept');
      await transfer(well(page), mixed);
      assert.deepEqual(await log(4), veto);
      await live(wellRoot(page)).filter({ hasText: 'Added 1 file.' }).waitFor();
      assert.deepEqual(await snapshot(), ['same-name control', 'base.md', 'a.md']);
      await transfer(well(page), [upload('b.md'), upload('bad.exe')]);
      assert.deepEqual((await eventLog(page, 5)).at(-1)[1].rejected, [
        ['b.md', 'too-many'],
        ['bad.exe', 'too-many'],
      ]);
      assert.deepEqual(await snapshot(), ['same-name control', 'base.md', 'a.md']);

      await page.getByLabel('Authority').selectOption('sync');
      await transfer(well(page), [upload('b.md')]);
      const sync = await log(7);
      assert.deepEqual(sync[0][2], ['base.md', 'a.md']);
      assert.deepEqual(sync[1][2], ['base.md', 'a.md', 'b.md']);
      await live(wellRoot(page)).filter({ hasText: 'Added 1 file.' }).waitFor();
      await page.getByLabel('Multiple', { exact: true }).uncheck();
      assert.deepEqual(await snapshot(), ['same-name control', 'base.md']);
      await page.getByLabel('Authority').selectOption('delay');
      await transfer(well(page), [upload('delayed.md')]);
      await eventLog(page, 9);
      await live(wellRoot(page)).filter({ hasText: 'Your selection is unchanged.' }).waitFor();
      const unchanged = await live(wellRoot(page)).locator('span').elementHandle();
      await button(page, 'Commit delayed').click();
      await settle(page);
      assert.deepEqual(await snapshot(), ['same-name control', 'delayed.md']);
      assert.equal(await unchanged.evaluate((node) => node.isConnected), true);
      await unchanged.dispose();
    },

  'File attachments prevent a trusted native drop from writing a second value': async ({
    page,
    mount,
  }) => {
    await mount('file-attachments');
    const input = well(page);
    await input.evaluate((node) => {
      node.dataset.trusted = '';
      node.dataset.changes = '0';
      node.addEventListener('drop', (event) => {
        node.dataset.trusted = String(event.isTrusted);
      });
      node.addEventListener('change', () => {
        node.dataset.changes = String(Number(node.dataset.changes) + 1);
      });
    });
    const source = await readFile(sourceFile);
    await page.getByLabel('Authority').selectOption('veto');
    await trustedDrop(page, input, sourceFile);
    assert.equal(await input.getAttribute('data-trusted'), 'true');
    assert.equal(await input.getAttribute('data-changes'), '0');
    assert.deepEqual((await eventLog(page, 2)).at(-1)[2], ['base.md']);
    await page.getByLabel('Authority').selectOption('accept');
    await trustedDrop(page, input, sourceFile);
    await eventLog(page, 4);
    assert.equal(await input.getAttribute('data-changes'), '0');
    assert.deepEqual(
      (await readEntries(page.locator(root), 'uploads')).at(-1).bytes,
      Array.from(source),
    );
    await trustedDrop(page, input, sourceFile);
    const rejected = (await eventLog(page, 5)).at(-1)[1].rejected;
    assert.deepEqual(rejected, [['anatomy.md', 'duplicate']]);
    await page.getByLabel('Multiple', { exact: true }).uncheck();
    await choose(page, () => input.press('Enter'), sourceFile);
    await eventLog(page, 7);
    await page.getByLabel('Multiple', { exact: true }).check();
    await choose(page, () => input.press('Enter'), sourceFile);
    assert.deepEqual((await eventLog(page, 8)).at(-1)[1].rejected, [['anatomy.md', 'duplicate']]);
    assert.equal(await input.getAttribute('data-changes'), '0');
  },

  'File attachments distinguish native resets, form owners and in-flight chooser results': async ({
    page,
    mount,
  }) => {
    await mount('file-attachments');
    const input = well(page);
    await transfer(input, [upload('kept.md', 'reset bytes', 423)]);
    await live(wellRoot(page)).filter({ hasText: 'Added 1 file.' }).waitFor();
    const local = page.locator(root);
    const external = page.locator(other);
    const retained = await readEntries(local, 'uploads');
    assert.deepEqual(
      await local.evaluate((form) => {
        form.reset();
        return [
          Array.from(new FormData(form).getAll('uploads'), (value) =>
            typeof value === 'string' ? value : [value.name, value.type, value.lastModified],
          ),
          form.querySelector('#bundle').validity.valid,
        ];
      }),
      [
        ['same-name control', ['base.md', 'text/markdown', 15], ['kept.md', 'text/markdown', 423]],
        true,
      ],
    );
    assert.deepEqual(await readEntries(local, 'uploads'), retained);
    const resetButton = button(page, 'Reset owner');
    await resetButton.click();
    assert.deepEqual(await readEntries(local, 'uploads'), retained);
    await resetButton.press('Enter');
    assert.deepEqual(await readEntries(local, 'uploads'), retained);
    await resetButton.evaluate((node) => {
      node.click();
      return new Promise(queueMicrotask);
    });
    assert.deepEqual(await readEntries(local, 'uploads'), retained);
    await live(wellRoot(page)).filter({ hasText: 'Added 1 file.' }).waitFor({ state: 'detached' });
    await eventLog(page, 2);

    await page.getByLabel('External owner').check();
    assert.deepEqual(await readEntries(local, 'uploads'), ['same-name control']);
    assert.deepEqual(
      (await readEntries(external, 'uploads')).filter((entry) => typeof entry !== 'string'),
      retained.slice(1),
    );
    assert.deepEqual(
      await external.evaluate((form) => {
        form.reset();
        return new FormData(form)
          .getAll('uploads')
          .filter((value) => value instanceof File)
          .map(({ name }) => name);
      }),
      ['base.md', 'kept.md'],
    );
    const [open] = await Promise.all([page.waitForEvent('filechooser'), input.press('Enter')]);
    await external.evaluate((form) => form.reset());
    await open
      .setFiles({ name: 'stale.md', mimeType: 'text/markdown', buffer: Buffer.from('stale') })
      .catch((error) => {
        // A reset may retire the hidden chooser before the simulated dialog delivers.
        assert.match(error.message, /detached|not attached/i);
      });
    await settle(page);
    await eventLog(page, 2);
    assert.deepEqual(
      (await readEntries(external, 'uploads')).filter((entry) => typeof entry !== 'string'),
      retained.slice(1),
    );

    await page.getByLabel('External owner').uncheck();
    await input.evaluate((node) => {
      const form = document.getElementById('external-owner');
      form.addEventListener('reset', () => node.setAttribute('form', form.id), { once: true });
      form.reset();
    });
    await settle(page);
    assert.deepEqual(
      (await readEntries(external, 'uploads')).filter((entry) => typeof entry !== 'string'),
      retained.slice(1),
    );
    assert.deepEqual(await readEntries(local, 'uploads'), ['same-name control']);
    assert.equal(await input.evaluate((node) => node.validity.valid), true);
    await input.evaluate((node) => node.removeAttribute('form'));
    await settle(page);
    const names = await external.evaluate((form) => {
      form.addEventListener(
        'reset',
        () => form.append(document.querySelector('[data-testid=well]')),
        { once: true },
      );
      form.reset();
      return Array.from(new FormData(form).getAll('uploads'), (value) =>
        typeof value === 'string' ? value : value.name,
      );
    });
    assert.deepEqual(names, ['other control', 'base.md', 'kept.md']);
    assert.deepEqual(
      (await readEntries(external, 'uploads')).filter((entry) => typeof entry !== 'string'),
      retained.slice(1),
    );
  },

  'File attachments settle the native reset before a direct carrier change in the same task':
    async ({ page, mount }) => {
      await mount('file-attachments');
      await transfer(compact(page), [upload('valid.md', 'keep only until reset')]);
      await eventLog(page, 2);
      const report = await compact(page).evaluate((node) => {
        const owner = node.form;
        owner.reset();
        const data = new DataTransfer();
        data.items.add(new File(['wrong'], 'wrong.txt', { type: 'text/plain' }));
        node.files = data.files;
        node.dispatchEvent(new Event('change', { bubbles: true }));
        return {
          name: new FormData(owner).get('schema').name,
          missing: node.validity.valueMissing,
        };
      });
      assert.deepEqual(report, { name: '', missing: true });
      const [, result, files] = (await eventLog(page, 3)).at(-1);
      assert.deepEqual(result.rejected, [['wrong.txt', 'type']]);
      assert.deepEqual(files, []);
    },

  'File attachments recover from a native writer failure without unmounting or announcing success':
    async ({ page, mount }) => {
      await mount('file-attachments');
      for (const mode of ['sync', 'accept']) {
        await page.getByLabel('Authority').selectOption(mode);
        const input = well(page);
        await input.evaluate((node) => {
          const files = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
          Object.defineProperty(node, 'files', {
            configurable: true,
            get() {
              return files.get.call(this);
            },
            set(next) {
              if (Array.from(next).some((file) => file.name === 'unwritable.md')) {
                throw new DOMException('File projection unavailable', 'NotSupportedError');
              }
              files.set.call(this, next);
            },
          });
        });
        await transfer(input, [upload('unwritable.md')]);
        await wellRoot(page)
          .getByText('Files could not be saved to this field.', { exact: false })
          .waitFor();
        assert.deepEqual(
          await input.evaluate((node) => [
            Array.from(node.files, ({ name }) => name),
            node.validity.customError,
          ]),
          [['base.md'], true],
        );
        assert.doesNotMatch(await live(wellRoot(page)).textContent(), /Added 1 file/);

        await page.getByLabel('Disable fieldset').check();
        await button(page, 'Clear controlled').click();
        await page.getByLabel('Disable fieldset').uncheck();
        assert.deepEqual(
          await input.evaluate((node) => [
            node.files.length,
            node.validity.customError,
            node.validity.valueMissing,
          ]),
          [0, false, true],
        );
        await page.reload();
        await well(page).waitFor();
      }
    },

  'File attachments open after a denied script click and after a sibling modal closes': async ({
    page,
    origin,
  }) => {
    await page.addInitScript(() => {
      const timer = setInterval(() => {
        const input = document.querySelector('#bundle:not(:disabled)');
        if (input && !navigator.userActivation.isActive) {
          clearInterval(timer);
          input.click();
          console.info('File picker script click completed');
        }
      }, 20);
    });
    await Promise.all([
      page.waitForEvent('console', {
        predicate: (message) => message.text() === 'File picker script click completed',
        timeout: 15_000,
      }),
      page.goto(new URL('/test/browser/?fixture=file-attachments&theme=soft-dark', origin).href),
    ]);
    const input = well(page);
    await choose(page, () => input.press('Enter'), sourceFile);
    await eventLog(page, 2);
    await page.evaluate(() => {
      const dialog = document.createElement('dialog');
      dialog.id = 'sibling-dialog';
      dialog.textContent = 'Application dialog';
      document.body.append(dialog);
    });
    const [retired] = await Promise.all([page.waitForEvent('filechooser'), input.press('Enter')]);
    await page.locator('#sibling-dialog').evaluate((node) => node.showModal());
    await settle(page);
    await page.locator('dialog:modal').evaluate((node) => node.close());
    await settle(page);
    await retired
      .setFiles({ name: 'old-picker.md', mimeType: 'text/markdown', buffer: Buffer.from('stale') })
      .catch((error) => assert.match(error.message, /detached|not attached/i));
    await eventLog(page, 2);
    await choose(page, () => input.press('Enter'), {
      name: 'after-close.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('modal closed'),
    });
    await eventLog(page, 4);
    assert.equal((await readEntries(page.locator(root), 'uploads')).at(-1).name, 'after-close.md');
  },

  'File attachments include the localized action in the name and show a count in multiple mode':
    async ({ page, mount }) => {
      await mount('file-native-labels');
      const compactLabel = page.locator('label[for=compact]');
      const picker = page.getByRole('button', { name: 'Add files Passport', exact: true });
      await picker.waitFor();
      assert.equal(
        await page.getByRole('button', { name: 'Pick evidence Enrolment', exact: true }).count(),
        1,
      );
      assert.equal(
        await page.getByRole('button', { name: 'Pick references', exact: true }).count(),
        1,
      );
      await choose(page, () => compactLabel.click(), {
        name: 'supporting-notes.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('abc'),
      });
      const field = page.getByTestId('compact');
      await field.getByText('1 file selected, 3 B', { exact: true }).waitFor();
      assert.equal(await field.getByText('supporting-notes.md', { exact: true }).count(), 0);
      await compactLabel.evaluate((node) => {
        node.textContent = 'Replacement passport';
      });
      await page
        .getByRole('button', { name: 'Add files Replacement passport', exact: true })
        .waitFor();
      await compactLabel.evaluate((node) => {
        node.htmlFor = 'unpaired';
      });
      await page.getByRole('button', { name: 'Add files', exact: true }).waitFor();
      assert.equal(await page.locator('label[for=unpaired]').getAttribute('id'), null);
      assert.equal(await page.locator('label[for=well]').getAttribute('id'), 'well-label');
    },

  'File attachments Workbench exercises directory rejection and same-name file identities': async ({
    page,
    origin,
  }) => {
    await page.goto(
      new URL('/?item=dropzone&tab=states&block=feedback&family=soft&scheme=light', origin).href,
    );
    await page.locator('html[data-wb-ready="1"]').waitFor({ state: 'attached', timeout: 20000 });
    const frame = page.locator('[data-wb-block=feedback]');
    const board = frame.locator('.wb-artboard').first();
    await button(page, 'Try a folder').click();
    await board
      .getByText(/is a folder.*Choose individual files/)
      .first()
      .waitFor();
    const listing = board.getByRole('list', { name: 'Selected files', exact: true });
    assert.equal(await listing.getByRole('listitem').count(), 1);
    const target = board.getByRole('button', { name: /Try file admission/ });
    await transfer(target, [
      upload('release-notes.md', 'A different length and modification time.', 2),
    ]);
    await listing.getByRole('listitem').nth(1).waitFor();
    await listing
      .getByRole('button', { name: /Remove .*release-notes[.]md/ })
      .first()
      .click();
    await listing.getByRole('listitem').nth(1).waitFor({ state: 'detached' });
    assert.equal(await listing.getByRole('listitem').count(), 1);
  },

  'File attachments discard a feedback commit after reset callbacks while preserving admission delivery':
    async ({ page, mount }) => {
      await mount('file-attachments');
      const mode = page.getByLabel('Reset during');
      await mode.selectOption('compact-value');
      await transfer(compact(page), [upload('accepted.md')]);
      assert.deepEqual((await eventLog(page, 2)).at(-1)[2], []);
      assert.equal((await readEntries(page.locator(root), 'schema'))[0].name, '');
      await settle(page);
      assert.equal(await live(author(page)).textContent(), '');

      await mode.selectOption('synthetic-compact-intake');
      await transfer(compact(page), [upload('local.md')]);
      await eventLog(page, 4);
      await live(author(page)).filter({ hasText: 'Added 1 file.' }).waitFor();
      assert.equal((await readEntries(page.locator(root), 'schema'))[0].name, 'local.md');

      await mode.selectOption('well-intake');
      await transfer(well(page), [upload('new.md'), upload('no.exe')]);
      await eventLog(page, 6);
      await settle(page);
      assert.equal(await live(wellRoot(page)).textContent(), '');
      assert.equal((await readEntries(page.locator(root), 'uploads')).at(-1).name, 'new.md');

      await mode.selectOption('cancel-well-intake');
      await transfer(well(page), [upload('bad.exe')]);
      await eventLog(page, 7);
      await live(wellRoot(page)).filter({ hasText: 'bad.exe' }).waitFor();
    },

  'File attachments gate file paste, fieldset legends, read-only, inert and loading': async ({
    page,
    mount,
  }) => {
    await mount('file-attachments');
    const input = well(page);
    const form = page.locator(root);
    await input.focus();
    assert.equal(await transfer(input, [], 'paste', 'plaintext only'), true);
    assert.equal(await transfer(input, [upload('paste.md')], 'paste', 'clipboard text'), false);
    assert.equal((await eventLog(page, 2)).at(-1)[1].source, 'paste');
    await page.getByLabel('Separate paste target').focus();
    assert.equal(await transfer(input, [upload('elsewhere.md')], 'paste'), true);
    await eventLog(page, 2);

    const retained = await readEntries(form, 'uploads');
    await page.getByLabel('Read only', { exact: true }).check();
    assert.equal(await input.getAttribute('aria-disabled'), 'true');
    assert.equal(await input.evaluate((node) => node.required), false);
    await compact(page).evaluate((node) => node.focus());
    await assertFocused(author(page).getByRole('group', { name: 'Mapping schema' }));
    await transfer(input, [upload('ignored.md')]);
    assert.deepEqual(await readEntries(form, 'uploads'), retained);
    await page.getByLabel('Disable fieldset').check();
    assert.equal(await input.evaluate((node) => node.matches(':disabled')), true);
    assert.deepEqual(await readEntries(form, 'uploads'), ['same-name control']);
    assert.equal(
      await page.getByRole('button', { name: 'Choose file · Legend file' }).isEnabled(),
      true,
    );

    await page.getByLabel('Disable fieldset').uncheck();
    await page.getByLabel('Read only', { exact: true }).uncheck();
    await page.getByLabel('Loading', { exact: true }).check();
    assert.equal(await input.getAttribute('aria-busy'), 'true');
    assert.equal(await compact(page).evaluate((node) => node.validity.valueMissing), true);
    await input.focus();
    await assertFocused(input);
    await transfer(input, [upload('busy.md')]);
    await page.getByLabel('Loading', { exact: true }).uncheck();
    await page.getByLabel('Inert', { exact: true }).check();
    assert.equal(await transfer(input, [upload('inert.md')]), false);
    assert.deepEqual(await readEntries(form, 'uploads'), retained);
    await eventLog(page, 2);
  },

  'File attachments stay closed before hydration and open one chooser afterward': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const html = await renderFixture('file-attachment-ssr');
    await mount('file-attachment-hydration');
    await page.getByTestId('cold-host').evaluate((host, markup) => {
      host.innerHTML = markup;
    }, html);
    const form = page.getByTestId('cold-form');
    const coldWell = form.locator('#cold-well');
    assert.deepEqual(
      await form.evaluate((owner) => [new FormData(owner).get('well'), owner.checkValidity()]),
      [null, true],
    );
    let opened = 0;
    page.on('filechooser', () => {
      opened += 1;
    });
    await form.locator('label[for=cold-compact]').click({ force: true });
    await form.locator('label[for=cold-well]').click({ force: true });
    const box = await getBox(coldWell);
    await page.mouse.click(box.x + 10, box.y + 10);
    await trustedDrop(page, coldWell, sourceFile);
    assert.equal(await coldWell.evaluate((node) => node.files.length), 0);
    assert.equal(opened, 0);
    await button(page, 'Hydrate attachments').click();
    await form.locator('#cold-well:not(:disabled)').waitFor();
    assert.equal(await form.evaluate((owner) => owner.checkValidity()), false);
    await choose(page, () => form.locator('label[for=cold-well]').click(), sourceFile);
    assert.equal(opened, 1);
    assert.equal((await readEntries(form, 'well'))[0].name, 'anatomy.md');
  },

  'File attachments preserve focus across retries and asynchronous removal without stealing it':
    async ({ page, mount }) => {
      await mount('file-attachment-rows');
      const queue = page.getByTestId('queue');
      const list = queue.getByRole('list');
      const remove = (name) => list.getByRole('button', { name: new RegExp(`Remove .*${name}`) });
      const retry = list.getByRole('button', { name: /Retry .*alpha[.]md/ });
      await retry.focus();
      await page.keyboard.down('Enter');
      await retry.waitFor({ state: 'detached' });
      await assertFocused(remove('alpha'));
      await page.keyboard.down('Enter');
      await page.keyboard.up('Enter');
      assert.equal(await page.getByTestId('row-actions').textContent(), 'retry:alpha.md');

      await page.keyboard.press('Enter');
      const alpha = page.getByTestId('alpha.md');
      await alpha.getByText('Removing…', { exact: true }).waitFor();
      assert.equal(await alpha.getByRole('progressbar').count(), 0);
      await assertFocused(remove('alpha'));
      await remove('alpha').evaluate((node) => node.click());
      assert.equal(
        await page.getByTestId('row-actions').textContent(),
        'retry:alpha.md remove:alpha.md',
      );
      await button(page, 'Reject removal').evaluate((node) => node.click());
      await alpha.getByText('Could not remove this file.').waitFor();
      await assertFocused(remove('alpha'));
      await page.keyboard.down('Enter');
      await button(page, 'Confirm removal').evaluate((node) => node.click());
      await alpha.waitFor({ state: 'detached' });
      await assertFocused(remove('beta'));
      await page.keyboard.down('Enter');
      await page.keyboard.up('Enter');
      assert.equal(
        await page.getByTestId('row-actions').textContent(),
        'retry:alpha.md remove:alpha.md remove:alpha.md',
      );

      await remove('last').press('Enter');
      await button(page, 'Confirm removal').evaluate((node) => node.click());
      await page.getByTestId('last.md').waitFor({ state: 'detached' });
      await assertFocused(remove('beta'));
      await page.keyboard.press('Enter');
      await button(page, 'Confirm removal').evaluate((node) => node.click());
      await page.getByTestId('beta.md').waitFor({ state: 'detached' });
      await assertFocused(page.getByRole('button', { name: /Choose another/ }));
      assert.equal(await list.getByRole('listitem').count(), 1);

      await page.reload();
      await remove('beta').press('Enter');
      const outside = page.getByLabel('Unrelated field');
      await outside.focus();
      await button(page, 'Confirm removal').evaluate((node) => node.click());
      await page.getByTestId('beta.md').waitFor({ state: 'detached' });
      await settle(page);
      await assertFocused(outside);
    },

  'File attachments announce phases quietly and release only owned thumbnail URLs': async ({
    page,
    mount,
  }) => {
    await mount('file-attachment-rows', {
      direction: 'rtl',
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    const queue = page.getByTestId('queue');
    const row = page.getByTestId('alpha.md');
    const status = queue.getByRole('status');
    assert.equal(await status.textContent(), '');
    await button(page, 'Transfer zero').click();
    const progress = row.getByRole('progressbar');
    assert.equal(await progress.getAttribute('aria-valuenow'), '0');
    await status.filter({ hasText: 'Uploading' }).waitFor();
    const announcement = await status.locator('span').elementHandle();
    await button(page, 'Transfer progress').click();
    assert.equal(await progress.getAttribute('aria-valuenow'), '65');
    assert.equal(await row.getByText('65%', { exact: true }).count(), 1);
    await button(page, 'Transfer complete').click();
    await row.getByText('Transfer complete · Awaiting verification').waitFor();
    assert.equal(await progress.getAttribute('aria-valuenow'), '100');
    assert.equal(await announcement.evaluate((node) => node.isConnected), true);
    await announcement.dispose();
    await button(page, 'Verify').click();
    await status.filter({ hasText: 'Checking file' }).waitFor();
    assert.equal(await progress.count(), 0);
    assert.equal(await row.locator('svg:visible').count(), 3);
    await button(page, 'Confirm upload').click();
    await status.filter({ hasText: 'Uploaded' }).waitFor();
    assert.equal(await progress.count(), 0);

    const saved = page.getByRole('list', { name: 'Saved references' });
    const stored = saved.getByRole('listitem').filter({ hasText: 'saved.md' });
    assert.equal(await stored.getByRole('link').getAttribute('download'), 'saved.md');
    assert.equal(await stored.getByRole('button').count(), 0);
    assert.equal(await stored.getByText('Selected locally').count(), 0);
    assert.equal(await saved.getByText('Selected locally').count(), 1);
    await page.evaluate(() => {
      const make = URL.createObjectURL;
      const revoke = URL.revokeObjectURL;
      window.createdFiles = [];
      window.revokedFiles = [];
      URL.createObjectURL = (file) => {
        const url = make.call(URL, file);
        window.createdFiles.push(url);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        window.revokedFiles.push(url);
        revoke.call(URL, url);
      };
    });
    await button(page, 'Broken thumbnail').click();
    await stored.locator('svg').waitFor();
    await button(page, 'Local thumbnail').click();
    await stored.locator('img').waitFor();
    await stored.locator('img').evaluate((node) => node.decode());
    await button(page, 'Local thumbnail').click();
    await page.waitForFunction(() => window.revokedFiles.length >= 1);
    await button(page, 'Unmount thumbnail').click();
    await page.waitForFunction(
      () =>
        window.createdFiles.length > 0 &&
        window.createdFiles.every((url) => window.revokedFiles.includes(url)),
    );
  },
};
