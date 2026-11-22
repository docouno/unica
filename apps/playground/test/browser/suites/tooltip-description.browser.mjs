import assert from 'node:assert/strict';

export default {
  'Tooltip preserves SSR names and restores missing author descriptions after hydration': async ({
    page,
    mount,
    renderFixture,
  }) => {
    const [html] = await Promise.all([
      renderFixture('tooltip-description-ssr'),
      mount('tooltip-description'),
    ]);
    const container = page.getByTestId('description-ssr');
    const before = await container.evaluate((node, markup) => {
      node.innerHTML = markup;
      const sources = [...node.querySelectorAll('a, [aria-describedby]')];
      window.descriptionSources = sources;
      const paragraph = node.querySelector('[data-testid="inline-context"]');
      const visual = paragraph.querySelector('[role="tooltip"]');
      return {
        paragraphs: node.querySelectorAll('p').length,
        textEdges: [
          paragraph.firstChild.textContent.trim(),
          paragraph.lastChild.textContent.trim(),
        ],
        visualTag: visual.localName,
        open: visual.matches(':popover-open'),
        ids: sources.map((source) => source.getAttribute('aria-describedby')),
      };
    }, html);
    assert.deepEqual(before.textEdges, ['Before', 'after']);
    assert.equal(before.paragraphs, 1, 'Parsed SSR Tooltip stayed within its paragraph');
    assert.equal(before.visualTag, 'span');
    assert.equal(before.open, false);

    const session = await page.context().newCDPSession(page);
    const { root } = await session.send('DOM.getDocument');
    const sourceIds = new Map();
    const checkDescription = async (testId, role, name, description) => {
      let nodeId = sourceIds.get(testId);
      if (!nodeId) {
        ({ nodeId } = await session.send('DOM.querySelector', {
          nodeId: root.nodeId,
          selector: `[data-testid="${testId}"]`,
        }));
        sourceIds.set(testId, nodeId);
      }
      const { nodes } = await session.send('Accessibility.getPartialAXTree', { nodeId });
      assert.equal(nodes[0].role.value, role, testId);
      assert.equal(nodes[0].name.value, name, testId);
      assert.equal(nodes[0].description?.value, description, testId);
    };
    const commonChecks = () =>
      Promise.all([
        checkDescription('inline-source', 'link', 'Read report', 'Original Extra'),
        checkDescription('label-only', 'button', 'Copy link'),
        checkDescription('known-idrefs', 'button', 'Known references', 'Context Scope Extra'),
        checkDescription('title-name', 'button', 'Title-only name', 'Extra'),
        checkDescription('title-description', 'button', 'Read details', 'Original Extra'),
        checkDescription('input-title', 'button', 'Send', 'Original Extra'),
        checkDescription('same-tab-router-link', 'link', 'Report details', 'Original Extra'),
        checkDescription(
          'plain-link',
          'link',
          'Link to report',
          'Original Extra Opens in a new tab',
        ),
      ]);
    await commonChecks();
    await checkDescription('missing-idref', 'button', 'Late reference', 'Extra');
    await checkDescription('router-link', 'link', 'Router to report', 'Extra Opens in a new tab');

    await page.getByRole('button', { name: 'Hydrate descriptions' }).click();
    await page.locator('[data-hydrated]').waitFor({ state: 'attached' });
    assert.equal(await page.getByTestId('description-errors').textContent(), '');
    assert.deepEqual(
      await container.evaluate((node) => {
        const sources = [...node.querySelectorAll('a, [aria-describedby]')];
        return {
          preserved:
            sources.length === window.descriptionSources.length &&
            sources.every((source, index) => source === window.descriptionSources[index]),
          ids: sources.map((source) => source.getAttribute('aria-describedby')),
        };
      }),
      { preserved: true, ids: before.ids },
    );
    await page.getByTestId('inline-context').locator(':popover-open').waitFor();
    await commonChecks();
    await checkDescription('missing-idref', 'button', 'Late reference', 'Original Extra');
    await checkDescription(
      'router-link',
      'link',
      'Router to report',
      'Original Extra Opens in a new tab',
    );

    await page.getByTestId('description-ssr').evaluate((node) => {
      const text = document.createElement('span');
      text.id = 'late-description';
      text.hidden = true;
      text.textContent = 'Resolved';
      node.append(text);
    });
    await checkDescription('missing-idref', 'button', 'Late reference', 'Resolved Extra');
    await checkDescription(
      'router-link',
      'link',
      'Router to report',
      'Resolved Extra Opens in a new tab',
    );
    await page.locator('#late-description').evaluate((node) => {
      node.textContent = 'Updated';
    });
    await checkDescription('missing-idref', 'button', 'Late reference', 'Updated Extra');
    await checkDescription(
      'router-link',
      'link',
      'Router to report',
      'Updated Extra Opens in a new tab',
    );
    await page.locator('#late-description').evaluate((node) => node.remove());
    await checkDescription('missing-idref', 'button', 'Late reference', 'Original Extra');
    await checkDescription(
      'router-link',
      'link',
      'Router to report',
      'Original Extra Opens in a new tab',
    );

    const lateReference = page.getByTestId('missing-idref');
    await lateReference.focus();
    await page
      .getByRole('button', { name: 'Remove Tooltip descriptions' })
      .evaluate((button) => button.click());
    assert.equal(await lateReference.getAttribute('aria-describedby'), 'late-description');
    await checkDescription('missing-idref', 'button', 'Late reference', 'Original');
    await checkDescription('same-tab-router-link', 'link', 'Report details', 'Original');
    await checkDescription(
      'router-link',
      'link',
      'Router to report',
      'Original Opens in a new tab',
    );
    await page
      .getByRole('button', { name: 'Clear one Tooltip label' })
      .evaluate((button) => button.click());
    await page.locator('#late-reference-preview').waitFor({ state: 'detached' });
    assert.equal(
      await lateReference.evaluate(
        (source) => source === document.activeElement && window.descriptionSources.includes(source),
      ),
      true,
    );
    await session.detach();
  },
};
