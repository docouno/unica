import { previewProps } from '../preview-code.js';
import type { PaginationValues } from './pagination.spec.js';

export function paginationCode({
  pageCount,
  page,
  defaultPage,
  size,
  format,
  label,
}: PaginationValues): string {
  const options = previewProps(
    { size, format, label: label.trim() ? label : 'Pagination' },
    { size: 'm', format: 'auto', label: 'Pagination' },
  );
  const position =
    page === 'uncontrolled'
      ? previewProps({ defaultPage }, { defaultPage: 1 })
      : previewProps({ page: Number(page) });

  return [
    "import '@docouno/unica/styles.css';",
    "import { Pagination } from './prototypes/pagination/pagination.proto.js';",
    '',
    'export function ResultPages() {',
    '  return (',
    '    <Pagination',
    `      pageCount={${pageCount}}${position}${options}`,
    "      onPageChange={(requestedPage) => console.info('Requested page', requestedPage)}",
    '    />',
    '  );',
    '}',
  ].join('\n');
}
