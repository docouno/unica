import { previewProps, previewText } from '../preview-code.js';
import type { LinkValues } from './link.spec.js';

export const guideFileName = 'field-guide.txt';
export const guideText =
  'Failover field guide\n\nCheck the replica health and confirm the recovery plan before starting a failover.\n';

export function guideLabel({
  children,
  download,
}: Pick<LinkValues, 'children' | 'download'>): string {
  if (download && (!children.trim() || children === 'Read the field guide')) {
    return 'Download the field guide';
  }
  return children.trim() ? children : 'Read the field guide';
}

export function linkCode(values: LinkValues): string {
  const { asChild, children, download, href, iconLeft, iconRight, ...options } = values;
  const attributes = previewProps(options, {
    tone: 'accent',
    underline: 'always',
    external: false,
    disabled: false,
    target: '',
    rel: '',
    'aria-current': '',
    newTabHint: '',
  });
  const icons = [iconLeft && 'FileTextIcon', iconRight && 'ArrowRightIcon'].filter(Boolean);
  const glyphs =
    (iconLeft ? ' iconLeft={FileTextIcon}' : '') + (iconRight ? ' iconRight={ArrowRightIcon}' : '');
  const hasAddress = asChild || Boolean(href);
  const file = hasAddress && download;
  const props = attributes + glyphs + (download ? ' download="' + guideFileName + '"' : '');
  const label = '<bdi>' + previewText(guideLabel({ children, download })) + '</bdi>';
  return [
    "import { Link } from '@docouno/unica';",
    "import '@docouno/unica/styles.css';",
    ...(icons.length ? [`import { ${icons.join(', ')} } from '@phosphor-icons/react';`] : []),
    '',
    hasAddress && !download
      ? "export function GuideLink({ href = '/guides/failover' } = {}) {"
      : 'export function GuideLink() {',
    ...(file
      ? [
          `  const text = ${JSON.stringify(guideText)};`,
          "  const href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);",
        ]
      : []),
    '  return (',
    ...(asChild
      ? [`    <Link asChild${props}>`, `      <a href={href}>${label}</a>`, '    </Link>']
      : [`    <Link${hasAddress ? ' href={href}' : ''}${props}>${label}</Link>`]),
    '  );',
    '}',
  ].join('\n');
}
