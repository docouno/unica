import { previewProps, previewText } from '../preview-code.js';
import type { EmptyValues } from './empty.spec.js';

export function emptyCode({
  size,
  align,
  as,
  heading,
  icon,
  color,
  children,
  description,
  actionLabel,
}: EmptyValues): string {
  const hasIcon = icon === 'document';
  const hasIllustration = children === 'landscape';
  const hasMedia = hasIcon || hasIllustration;
  const hasTitle = Boolean(heading.trim());
  const hasDescription = Boolean(description.trim());
  const hasAction = Boolean(actionLabel.trim());
  const imports = [
    ...(hasAction ? ['Button'] : []),
    'Empty',
    ...(hasAction ? ['EmptyActions'] : []),
    ...(hasDescription ? ['EmptyDescription'] : []),
    ...(hasMedia ? ['EmptyMedia'] : []),
    ...(hasTitle ? ['EmptyTitle'] : []),
  ];
  const attrs = previewProps({ size, align }, { size: 'm', align: 'center' });
  const titleAttrs = previewProps({ as }, { as: 'h3' });
  const mediaAttrs =
    (hasIcon ? ' icon={FileTextIcon}' : '') +
    (hasIcon && !hasIllustration ? previewProps({ color }, { color: 'muted' }) : '');
  const options = [
    ...(hasAction ? ["pagesHref = '/pages'"] : []),
    ...(hasIllustration ? ["illustrationSrc = '/assets/empty-landscape.svg'"] : []),
  ];
  return [
    `import { ${imports.join(', ')} } from '@docouno/unica';`,
    ...(hasIcon ? ["import { FileTextIcon } from '@phosphor-icons/react';"] : []),
    '',
    `export function SavedPages(${options.length ? `{ ${options.join(', ')} } = {}` : ''}) {`,
    '  return (',
    `    <Empty${attrs}>`,
    ...(hasIllustration
      ? [
          `      <EmptyMedia${mediaAttrs}>`,
          '        <img src={illustrationSrc} alt="" width="240" height="180" />',
          '      </EmptyMedia>',
        ]
      : hasMedia
        ? [`      <EmptyMedia${mediaAttrs} />`]
        : []),
    ...(hasTitle
      ? [`      <EmptyTitle${titleAttrs}><bdi>${previewText(heading)}</bdi></EmptyTitle>`]
      : []),
    ...(hasDescription
      ? [`      <EmptyDescription><bdi>${previewText(description)}</bdi></EmptyDescription>`]
      : []),
    ...(hasAction
      ? [
          '      <EmptyActions>',
          '        <Button asChild tone="accent" variant="secondary">',
          `          <a href={pagesHref}>${previewText(actionLabel)}</a>`,
          '        </Button>',
          '      </EmptyActions>',
        ]
      : []),
    '    </Empty>',
    '  );',
    '}',
  ].join('\n');
}
