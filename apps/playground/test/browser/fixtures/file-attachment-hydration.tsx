import { useRef } from 'react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import ColdAttachments from './file-attachment-ssr.js';

export default function AttachmentHydration(): ReactElement {
  const mount = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (mount.current) {
            hydrateRoot(mount.current, <ColdAttachments />);
          }
        }}
      >
        Hydrate attachments
      </button>
      <div ref={mount} data-testid="cold-host" suppressHydrationWarning />
    </>
  );
}
