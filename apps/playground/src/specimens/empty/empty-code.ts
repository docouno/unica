import { previewProps, previewText } from '../preview-code.js';
import type { EmptyValues } from './empty.spec.js';

export function emptyCode({ size, align, heading, media }: EmptyValues): string {
  const hasMedia = media === 'icon';
  const hasTitle = Boolean(heading.trim());
  const slots = [
    'Empty',
    'EmptyActions',
    'EmptyDescription',
    ...(hasMedia ? ['EmptyMedia'] : []),
    ...(hasTitle ? ['EmptyTitle'] : []),
  ];
  const attrs = previewProps({ size, align }, { size: 'm', align: 'center' });
  return [
    "import { Button } from '@docouno/unica';",
    ...(hasMedia ? ["import { FileTextIcon } from '@phosphor-icons/react';"] : []),
    `import { ${slots.join(', ')} } from './prototypes/empty/empty.proto.js';`,
    '',
    "export function SavedPages({ pagesHref = '/pages' } = {}) {",
    '  return (',
    `    <Empty${attrs}>`,
    ...(hasMedia ? ['      <EmptyMedia icon={FileTextIcon} />'] : []),
    ...(hasTitle ? [`      <EmptyTitle><bdi>${previewText(heading)}</bdi></EmptyTitle>`] : []),
    '      <EmptyDescription><bdi>Save a page to keep it close at hand.</bdi></EmptyDescription>',
    '      <EmptyActions>',
    '        <Button asChild tone="accent" variant="secondary">',
    '          <a href={pagesHref}>Browse pages</a>',
    '        </Button>',
    '      </EmptyActions>',
    '    </Empty>',
    '  );',
    '}',
  ].join('\n');
}
