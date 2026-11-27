import { previewProps, previewText } from '../preview-code.js';
import type { BreadcrumbValues } from './breadcrumb.spec.js';

export function breadcrumbCode({
  size,
  underline,
  separator,
  page,
  current,
}: BreadcrumbValues): string {
  const hasPage = Boolean(page.trim());
  const staticPage = hasPage && current === 'page';
  const permalink = hasPage && current === 'permalink';
  const currentLabel = `<bdi>${previewText(page)}</bdi>`;
  const chevron = separator === 'chevron';
  const separatorProp = chevron
    ? ' separator={<Icon usage="slot" icon={CaretRightIcon} directional />}'
    : separator === 'none'
      ? ' separator={null}'
      : '';
  const props = previewProps({ size, underline }, { size: 'm', underline: 'always' });
  return [
    "import '@docouno/unica/styles.css';",
    `import { Breadcrumb, BreadcrumbLink${staticPage ? ', BreadcrumbPage' : ''}${chevron ? ', Icon' : ''} } from '@docouno/unica';`,
    ...(chevron ? ["import { CaretRightIcon } from '@phosphor-icons/react';"] : []),
    '',
    `export function DocumentTrail({ workspaceHref = '/workspace', runbooksHref = '/runbooks'${permalink ? ", guideHref = '/runbooks/guide'" : ''} } = {}) {`,
    '  return (',
    `    <Breadcrumb${props}${separatorProp}>`,
    '      <BreadcrumbLink href={workspaceHref}>Workspace</BreadcrumbLink>',
    '      <BreadcrumbLink href={runbooksHref}>Runbooks</BreadcrumbLink>',
    ...(hasPage
      ? [
          staticPage
            ? `      <BreadcrumbPage>${currentLabel}</BreadcrumbPage>`
            : `      <BreadcrumbLink ${permalink ? 'href={guideHref}' : 'disabled'} aria-current="page">${currentLabel}</BreadcrumbLink>`,
        ]
      : []),
    '    </Breadcrumb>',
    '  );',
    '}',
  ].join('\n');
}
