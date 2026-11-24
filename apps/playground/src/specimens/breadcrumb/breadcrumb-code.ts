import { previewProps, previewText } from '../preview-code.js';
import type { BreadcrumbValues } from './breadcrumb.spec.js';

export function breadcrumbCode({ size, underline, separator, page }: BreadcrumbValues): string {
  const hasPage = Boolean(page.trim());
  const chevron = separator === 'chevron';
  const separatorProp = chevron
    ? ' separator={<Icon usage="slot" icon={CaretRightIcon} directional />}'
    : separator === 'none'
      ? ' separator={null}'
      : '';
  const props = previewProps({ size, underline }, { size: 'm', underline: 'always' });
  return [
    "import '@docouno/unica/styles.css';",
    ...(chevron
      ? [
          "import { Icon } from '@docouno/unica';",
          "import { CaretRightIcon } from '@phosphor-icons/react';",
        ]
      : []),
    `import { Breadcrumb, BreadcrumbLink${hasPage ? ', BreadcrumbPage' : ''} } from './prototypes/breadcrumb/breadcrumb.proto.js';`,
    '',
    "export function DocumentTrail({ workspaceHref = '/workspace', runbooksHref = '/runbooks' } = {}) {",
    '  return (',
    `    <Breadcrumb${props}${separatorProp}>`,
    '      <BreadcrumbLink href={workspaceHref}>Workspace</BreadcrumbLink>',
    '      <BreadcrumbLink href={runbooksHref}>Runbooks</BreadcrumbLink>',
    ...(hasPage ? [`      <BreadcrumbPage><bdi>${previewText(page)}</bdi></BreadcrumbPage>`] : []),
    '    </Breadcrumb>',
    '  );',
    '}',
  ].join('\n');
}
