import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Pagination } from '@docouno/unica';

const burmese = '၀၁၂၃၄၅၆၇၈၉';
const tolongSiki = Array.from({ length: 10 }, (_, digit) =>
  String.fromCodePoint(0x11de0 + digit),
).join('');

export default function PaginationSSR(): ReactElement {
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    wrapper.current?.setAttribute('data-hydrated', '');
  }, []);
  const link = { pageCount: 240, page: 123, getPageHref: (page: number) => `?page=${page}` };
  return (
    <div ref={wrapper}>
      <div style={{ inlineSize: 700 }}>
        <Pagination {...link} lang="my" aria-label="Default digits" />
        <Pagination
          {...link}
          lang="my"
          aria-label="Burmese digits"
          messages={{ digits: burmese }}
        />
        <Pagination
          {...link}
          lang="my"
          aria-label="Invalid digits"
          messages={{ digits: '၀၁၂၃၄၅၆၇၈၈', pageLabel: 'No placeholder' }}
        />
        <Pagination {...link} aria-label="Astral digits" messages={{ digits: '𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡' }} />
        <Pagination {...link} aria-label="Tolong Siki digits" messages={{ digits: tolongSiki }} />
      </div>
      <div style={{ inlineSize: 240 }}>
        <h2 id="compact-heading">Collection page controls</h2>
        <Pagination
          {...link}
          aria-labelledby="compact-heading"
          aria-label="Fallback pages"
          lang="ar"
          dir="rtl"
          messages={{
            previousPage: 'السابقة',
            nextPage: 'التالية',
            position: 'من أصل {pageCount}، الصفحة {page}',
            digits: '٠١٢٣٤٥٦٧٨٩',
          }}
        />
      </div>
    </div>
  );
}
