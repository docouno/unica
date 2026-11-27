import type { PaginationMessages } from '@docouno/unica';
import { previewProps } from '../preview-code.js';
import type { PaginationValues } from './pagination.spec.js';

export const arabicMessages: PaginationMessages = {
  previousPage: 'الصفحة السابقة',
  nextPage: 'الصفحة التالية',
  pageLabel: 'الصفحة {page}',
  position: 'من أصل {pageCount}، الصفحة {page}',
  digits: '٠١٢٣٤٥٦٧٨٩',
};

export function paginationCode({
  pageCount,
  page,
  defaultPage,
  size,
  format,
  'aria-label': label,
  getPageHref,
  renderLink,
  messages,
}: PaginationValues): string {
  const linked = getPageHref === 'archive';
  const localized = messages === 'arabic';
  const options = previewProps(
    { size, format, 'aria-label': label.trim() || 'Pagination' },
    { size: 'm', format: 'auto', 'aria-label': 'Pagination' },
  );
  const position =
    page === 'uncontrolled' && !linked
      ? previewProps({ defaultPage }, { defaultPage: 1 })
      : previewProps({ page: page === 'uncontrolled' ? 1 : Number(page) });
  const route = linked
    ? [
        '      getPageHref={(page) => `/archive?page=${page}`}',
        ...(renderLink === 'custom' ? ['      renderLink={(props) => <a {...props} />}'] : []),
      ]
    : ["      onPageChange={(requestedPage) => console.info('Requested page', requestedPage)}"];

  return [
    "import '@docouno/unica/styles.css';",
    "import { Pagination } from '@docouno/unica';",
    '',
    'export function ResultPages() {',
    '  return (',
    '    <Pagination',
    `      pageCount={${pageCount}}${position}${options}`,
    ...(localized
      ? [`      lang="ar" dir="rtl" messages={${JSON.stringify(arabicMessages)}}`]
      : []),
    ...route,
    '    />',
    '  );',
    '}',
  ].join('\n');
}
