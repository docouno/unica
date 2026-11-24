import type { ReactElement } from 'react';
import { Stack, Text, Title } from '@docouno/unica';
import { Pagination } from '../../prototypes/pagination/pagination.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { focusLinkedFragment, specimenBlockPage } from '../shared/specimen-fragment.js';

const fieldNotes = [
  ['First frost', 'Ice covered the shallow pools along the north bank.'],
  ['Reed beds', 'The tallest reeds still held seed after the frost.'],
  ['Heron tracks', 'Fresh tracks crossed the mud at the east inlet.'],
  ['High water', 'Overnight rain reached the lowest mark on the gauge.'],
  ['A new channel', 'Water cut a narrow path through the gravel bar.'],
  ['Otter trail', 'A line of prints led from the reeds into the creek.'],
  ['Open pools', 'The ice cleared from the last shaded pool by noon.'],
] as const;

export function ArchivePages({ ctx }: PreviewProps): ReactElement {
  const archiveId = `archive-${ctx.theme.id}`;
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const route = new URLSearchParams(search);
  const block =
    route.get('block') === 'links'
      ? ''
      : specimenBlockPage('pagination', 'states', 'links', ctx.theme.id);
  const pages = new URLSearchParams(block || search);
  pages.set('tab', 'states');
  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  const legacy = /^#pagination-page-([1-7])$/u.exec(hash)?.[1];
  // Older bookmarks opened every artboard on the same page.
  if (legacy) {
    pages.set('archivePage', legacy);
  }
  const prefix = `#${archiveId}-`;
  const requested = Number(
    pages.get(archiveId) ??
      (hash.startsWith(prefix) ? hash.slice(prefix.length) : pages.get('archivePage')),
  );
  const page =
    Number.isInteger(requested) && requested >= 1 && requested <= fieldNotes.length ? requested : 1;
  const [title, note] = fieldNotes[page - 1]!;

  function pageHref(number: number): string {
    const next = new URLSearchParams(pages);
    next.set(archiveId, String(number));
    return `?${next}${prefix}${number}`;
  }

  return (
    <ExampleSurface surface={ctx.surface}>
      <Stack gap={4}>
        <Text size="caption-l" color="secondary">
          <bdi>
            Field notes · <time dateTime={`2025-11-0${page}`}>{page} November 2025</time>
          </bdi>
        </Text>
        <Title
          as="h3"
          size="body-m"
          id={`${archiveId}-${page}`}
          ref={focusLinkedFragment}
          tabIndex={-1}
        >
          {title}
        </Title>
        <Text size="body-s">
          <bdi>{note}</bdi>
        </Text>
      </Stack>
      <Pagination
        {...ctx.subject}
        label="Archive pages"
        format="pages"
        size="s"
        pageCount={fieldNotes.length}
        page={page}
        getPageHref={pageHref}
      />
    </ExampleSurface>
  );
}
