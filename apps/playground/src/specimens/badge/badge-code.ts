import { previewProps, previewText } from '../preview-code.js';
import type { BadgeValues } from './badge.spec.js';

export const badgeDetail = 'Source: current draft.';

export function countNoun(label: string): string {
  if (/^[0-9]+\+?$/u.test(label)) {
    return label === '1' ? 'review' : 'reviews';
  }
  return '';
}

export function badgeCode({
  element,
  href,
  disabled,
  children,
  iconLeft,
  ...props
}: BadgeValues): string {
  const label = children.trim() ? children : '';
  const noun = countNoun(label);
  const glyph = iconLeft === 'none' ? '' : ` iconLeft={${iconLeft}}`;
  const attributes = previewProps(props, { size: 'm', status: 'neutral', dot: false }) + glyph;
  const linked = element === 'a' && href === 'details';
  const details = Boolean(label) && (linked || element === 'button');
  const accessibleName = noun && details ? ` aria-label=${previewText(label + ' ' + noun)}` : '';
  let child = previewText(label);
  if (element === 'button') {
    const disclosure = details
      ? ' aria-expanded={expanded} aria-controls={detailId} onClick={() => setExpanded((open) => !open)}'
      : '';
    child = `<button type="button"${disabled ? ' disabled' : ''}${accessibleName}${disclosure}>${child}</button>`;
  } else if (element === 'a') {
    child = `<a${linked && details ? " href={'#' + detailId}" : ''}${accessibleName}>${child}</a>`;
  }
  const badge = `<Badge${element === 'span' ? '' : ' asChild'}${attributes}>${child}</Badge>`;
  const sample = noun
    ? `<bdi dir="ltr">${badge}{' '}<Text as="span" size="caption-l"${details ? ' aria-hidden' : ''}>${noun}</Text></bdi>`
    : badge;
  const library = ['Badge', ...(details ? ['Stack'] : []), ...(details || noun ? ['Text'] : [])];
  const imports = [
    ...(details ? [`import { ${linked ? 'useId' : 'useId, useState'} } from 'react';`] : []),
    `import { ${library.join(', ')} } from '@docouno/unica';`,
    ...(glyph ? [`import { ${iconLeft} } from '@phosphor-icons/react';`] : []),
  ].join('\n');
  if (!details) {
    return `${imports}\n\n${sample}`;
  }
  const state = linked ? '' : '\n  const [expanded, setExpanded] = useState(false);';
  return `${imports}

export function BadgeDetails() {
  const detailId = useId();${state}
  return (
    <Stack align="start" gap={8}>
      ${sample}
      <Text id={detailId} size="body-s" ${linked ? 'tabIndex={-1}' : disabled ? 'hidden' : "style={{ visibility: expanded ? 'visible' : 'hidden' }}"}><bdi>${badgeDetail}</bdi></Text>
    </Stack>
  );
}`;
}
