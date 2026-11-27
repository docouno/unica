import { useState } from 'react';
import type { ReactElement } from 'react';
import { Pagination } from '@docouno/unica';

const fontUrl = new URL('./assets/pagination-fullwidth-400.ttf', import.meta.url).href;

const font = `
  @font-face {
    font-family: "Pagination fullwidth fixture";
    src: url("${fontUrl}") format("truetype");
    unicode-range: U+FF10-FF19;
  }
  .pagination-fullwidth {
    --font-family-base: "Pagination fullwidth fixture", monospace;
  }
`;

export default function PaginationGeometry(): ReactElement {
  const [page, setPage] = useState(999);
  return (
    <>
      <style>{font}</style>
      <div style={{ inlineSize: 240, padding: 4 }} data-testid="narrow">
        <Pagination pageCount={24} defaultPage={12} aria-label="Narrow auto" />
        <Pagination pageCount={12840} page={page} aria-label="Large compact" />
      </div>
      <div style={{ inlineSize: 700, padding: 4 }} data-testid="wide">
        <Pagination pageCount={24} defaultPage={12} aria-label="Wide auto" />
        <Pagination pageCount={12840} page={page} aria-label="Large numbered" />
      </div>
      <div style={{ inlineSize: 280, padding: 4 }}>
        <Pagination pageCount={2} size="s" aria-label="Short auto" />
        <Pagination pageCount={2} size="s" format="pages" aria-label="Short explicit" />
      </div>
      <div className="pagination-fullwidth" style={{ inlineSize: 688 }} data-testid="fullwidth">
        <Pagination
          pageCount={12840}
          page={10001}
          format="pages"
          aria-label="Fullwidth digits"
          messages={{ digits: '０１２３４５６７８９' }}
        />
      </div>
      <div style={{ inlineSize: 272, padding: 4 }}>
        <Pagination
          pageCount={12840}
          page={page}
          size="l"
          aria-label="Localized wrapping"
          lang="ar"
          dir="rtl"
          messages={{
            nextPage: 'التالي',
            previousPage: 'السابق',
            position: 'من أصل {pageCount} صفحة، أنت الآن في الصفحة {page}',
            digits: '٠١٢٣٤٥٦٧٨٩',
          }}
        />
        <div dir="ltr">
          <Pagination pageCount={2} size="s" format="pages" aria-label="Nested LTR" />
        </div>
      </div>
      <button onClick={() => setPage(1)}>Set first</button>
      <button onClick={() => setPage(1000)}>Set 1000</button>
      <button onClick={() => setPage(12840)}>Set last</button>
    </>
  );
}
