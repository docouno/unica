import { Profiler, useRef, type ProfilerOnRenderCallback } from 'react';
import { hydrateRoot } from 'react-dom/client';
import LayoutSsr from './layout-ssr';

export default function LayoutHydration() {
  const server = useRef<HTMLDivElement>(null);
  const client = useRef<HTMLDivElement>(null);
  const errors = useRef<HTMLOutputElement>(null);
  const countCommit: ProfilerOnRenderCallback = (id) => {
    const mount = id === 'server' ? server.current : client.current;
    if (mount) {
      mount.dataset.commits = String(Number(mount.dataset.commits ?? 0) + 1);
    }
  };

  function hydrate() {
    const mount = server.current;
    if (!mount) {
      return;
    }
    hydrateRoot(
      mount,
      <Profiler id="server" onRender={countCommit}>
        <LayoutSsr />
      </Profiler>,
      {
        onRecoverableError(error) {
          if (errors.current) {
            errors.current.textContent += String(error);
          }
        },
      },
    );
  }

  return (
    <>
      <button type="button" onClick={hydrate}>
        Hydrate layout
      </button>
      <output ref={errors} data-testid="layout-hydration-errors" />
      <div ref={server} data-testid="layout-server" />
      <Profiler id="client" onRender={countCommit}>
        <div ref={client} data-testid="layout-client">
          <LayoutSsr />
        </div>
      </Profiler>
    </>
  );
}
