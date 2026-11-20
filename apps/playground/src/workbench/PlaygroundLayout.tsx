import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';

type PanelId = 'controls' | 'events' | 'form-data';

interface Panel {
  readonly id: PanelId;
  readonly label: string;
  readonly content: ReactNode;
}

function PanelTabs({
  panels,
  selected,
  onSelect,
}: {
  readonly panels: readonly Panel[];
  readonly selected: PanelId;
  readonly onSelect: (panel: PanelId) => void;
}): ReactElement {
  const id = useId();

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    let next: number;
    switch (event.key) {
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = panels.length - 1;
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const step = (event.key === 'ArrowRight') === rtl ? -1 : 1;
        next = (index + panels.length + step) % panels.length;
        break;
      }
      default:
        return;
    }
    event.preventDefault();
    onSelect(panels[next]!.id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }

  return (
    <div className="wb-inspector-panes">
      <div className="wb-tabs wb-panel-tabs" role="tablist" aria-label="Playground panels">
        {panels.map((panel, index) => (
          <button
            key={panel.id}
            type="button"
            className="wb-tab"
            data-active={panel.id === selected || undefined}
            role="tab"
            id={`${id}-tab-${panel.id}`}
            aria-controls={`${id}-panel-${panel.id}`}
            aria-selected={panel.id === selected}
            tabIndex={panel.id === selected ? 0 : -1}
            onClick={() => onSelect(panel.id)}
            onKeyDown={(event) => moveFocus(event, index)}
          >
            {panel.label}
          </button>
        ))}
      </div>
      {panels.map((panel) => (
        <div
          key={panel.id}
          className="wb-tab-panel wb-scroll"
          role="tabpanel"
          id={`${id}-panel-${panel.id}`}
          aria-labelledby={`${id}-tab-${panel.id}`}
          data-wb-panel={panel.id}
          hidden={panel.id !== selected}
          tabIndex={0}
        >
          {panel.id === selected && panel.content}
        </div>
      ))}
    </div>
  );
}

export function PlaygroundLayout({
  preview,
  code,
  controls,
  events,
  formData,
}: {
  readonly preview: ReactNode;
  readonly code: ReactNode;
  readonly controls: ReactNode;
  readonly events: ReactNode;
  readonly formData: ReactNode;
}): ReactElement {
  const inspectorId = useId();
  const codeId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const launchRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const [compact, setCompact] = useState(false);
  const [selection, setSelection] = useState<PanelId>('controls');
  useLayoutEffect(() => {
    const layout = ref.current;
    if (!layout) {
      return;
    }
    const measure = (): void => {
      const width = layout.clientWidth;
      const nextCompact = width < 768;
      if (width === 0 || nextCompact === layout.hasAttribute('data-wb-compact')) {
        return;
      }
      const active = document.activeElement;
      restoreFocus.current =
        active === launchRef.current ||
        document.getElementById(inspectorId)?.contains(active) === true;
      setCompact(nextCompact);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(layout);
    return () => observer.disconnect();
  }, [inspectorId]);

  useLayoutEffect(() => {
    if (!restoreFocus.current) {
      return;
    }
    restoreFocus.current = false;
    const sidebar = document.getElementById(inspectorId);
    const target = compact
      ? launchRef.current
      : (sidebar?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ??
        sidebar?.querySelector<HTMLElement>('.wb-inspector-source-scroll'));
    target?.focus({ preventScroll: true });
  }, [compact, inspectorId]);

  const panels: Panel[] = [];
  if (controls) {
    panels.push({ id: 'controls', label: 'Controls', content: controls });
  }
  if (events) {
    panels.push({ id: 'events', label: 'Events', content: events });
  }
  if (formData) {
    panels.push({ id: 'form-data', label: 'FormData', content: formData });
  }

  const selected = panels.find((panel) => panel.id === selection)?.id ?? panels[0]?.id;
  const panes = (
    <div className="wb-inspector-split" data-wb-has-panes={selected !== undefined || undefined}>
      {compact && (
        <div className="wb-inspector-toolbar">
          <span>Inspector</span>
          <button
            type="button"
            className="wb-action-btn"
            aria-label="Close inspector"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </button>
        </div>
      )}
      {selected && <PanelTabs panels={panels} selected={selected} onSelect={setSelection} />}
      <div className="wb-inspector-source">
        <h2 id={codeId}>JSX</h2>
        <div
          className="wb-inspector-source-scroll wb-scroll"
          aria-labelledby={codeId}
          role="region"
          tabIndex={0}
        >
          {code}
        </div>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="wb-playground-layout" data-wb-compact={compact || undefined}>
      {compact && (
        <div className="wb-inspector-launch">
          <button
            ref={launchRef}
            type="button"
            className="wb-action-btn"
            aria-haspopup="dialog"
            aria-controls={inspectorId}
            onClick={() => dialogRef.current?.showModal()}
          >
            Inspector
          </button>
        </div>
      )}
      <div
        key="preview"
        className="wb-playground-preview wb-scroll"
        role="region"
        aria-label="Preview"
        tabIndex={0}
      >
        {preview}
      </div>
      {compact ? (
        <dialog
          ref={dialogRef}
          id={inspectorId}
          className="wb-playground-sidebar"
          aria-label="Playground inspector"
        >
          {panes}
        </dialog>
      ) : (
        <aside id={inspectorId} className="wb-playground-sidebar" aria-label="Playground inspector">
          {panes}
        </aside>
      )}
    </div>
  );
}
