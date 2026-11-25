import { useRef, useState } from 'react';

export const documentLink = 'https://www.postgresql.org/docs/17/warm-standby-failover.html';

export function useDocumentReceipt() {
  const [receipt, setReceipt] = useState('');
  const latest = useRef(0);
  function report(text = '') {
    latest.current++;
    setReceipt(text);
  }
  function copyLink() {
    const request = ++latest.current;
    setReceipt('Copying guide link…');
    const finish = (copied = false) => {
      if (latest.current === request) {
        setReceipt(copied ? 'Guide link copied.' : 'Could not copy the guide link.');
      }
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(documentLink).then(
        () => finish(true),
        () => finish(),
      );
    } else {
      finish();
    }
  }
  return { receipt, report, copyLink };
}
