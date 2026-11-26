import { ToastViewport, UnicaProvider } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement, Ref } from 'react';

/** Positions a scene's notification queue relative to its own visible canvas. */
export function FolioToastRegion({
  ref,
}: {
  readonly ref?: Ref<HTMLDivElement> | undefined;
}): ReactElement {
  const [scope, setScope] = useState<HTMLDivElement | null>(null);
  return (
    <div className="folio-toast-scope" ref={setScope}>
      <UnicaProvider portalContainer={scope}>
        <ToastViewport ref={ref} />
      </UnicaProvider>
    </div>
  );
}
