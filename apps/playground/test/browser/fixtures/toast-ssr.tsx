import { Toast, ToastProvider, ToastViewport, UnicaProvider, useToast } from '@docouno/unica';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

function Feedback(): ReactElement {
  const toast = useToast();
  const seeded = useRef(false);
  const outlet = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      toast.show({ title: 'Hydrated result', persistent: true });
    }
  }, [toast]);
  return (
    <>
      <Toast title="Server rendered note">Available immediately.</Toast>
      <button type="button" onClick={() => setHost(outlet.current)}>
        Mount notifications
      </button>
      <div ref={outlet} id="hydrated-host" />
      <UnicaProvider portalContainer={host}>
        <ToastViewport />
      </UnicaProvider>
    </>
  );
}

export default function ToastSsr(): ReactElement {
  return (
    <ToastProvider>
      <Feedback />
    </ToastProvider>
  );
}
