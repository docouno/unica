import { useId, useState } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { ViewSettings } from './ViewSettings.js';

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

export function PlaygroundPanels({
  code,
  controls,
  events,
  formData,
}: {
  readonly code: ReactNode;
  readonly controls: ReactNode;
  readonly events: ReactNode;
  readonly formData: ReactNode;
}): ReactElement {
  const codeId = useId();
  const [selection, setSelection] = useState<PanelId>('controls');

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
  return (
    <ViewSettings>
      <div className="wb-inspector-split" data-wb-has-panes={selected !== undefined || undefined}>
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
    </ViewSettings>
  );
}
