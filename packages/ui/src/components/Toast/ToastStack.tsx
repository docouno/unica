import { Fragment } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import type { GlyphComponent } from '../../core/glyph.js';
import { CaretGlyph } from '../../internal/glyphs/index.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../Button/IconButton.js';
import { Divider } from '../Divider/Divider.js';
import { ToastCard } from './Toast.js';
import type { ToastEntry } from './store.js';
import type { ToastId, ToastMessages } from './types.js';

const chevronUp: GlyphComponent = (props) => <CaretGlyph {...props} direction="up" />;
const chevronDown: GlyphComponent = (props) => <CaretGlyph {...props} direction="down" />;

interface ListProps {
  readonly id: string;
  readonly entries: readonly ToastEntry[];
  readonly front: ToastEntry;
  readonly expanded: boolean;
  readonly top: boolean;
  readonly messages: ToastMessages;
  readonly dismiss: (id: ToastId) => void;
}

function Item({
  entry,
  summary,
  dismiss,
}: {
  readonly entry: ToastEntry;
  readonly summary?: string | undefined;
  readonly dismiss: (id: ToastId) => void;
}): ReactElement {
  const { id, title, description, status, loading, action, actionLayout } = entry;
  return (
    <ToastCard
      title={title}
      status={status}
      loading={loading}
      action={action}
      actionLayout={actionLayout}
      summary={summary}
      onDismiss={() => dismiss(id)}
    >
      {description}
    </ToastCard>
  );
}

export function ToastList({
  entries,
  front,
  id,
  expanded,
  top,
  messages,
  dismiss,
}: ListProps): ReactElement {
  if (!expanded) {
    const hiddenIssues = entries.filter(
      (entry) => entry.id !== front.id && (entry.status === 'warning' || entry.status === 'danger'),
    ).length;
    const plates = Math.min(2, entries.length - 1);
    return (
      <div
        id={id}
        className={plates ? 'unica-toast-stack' : 'unica-toast-stack unica-scrollbar'}
        data-unica-toast-plates={plates}
      >
        {plates === 2 && <Plate depth={2} />}
        {plates >= 1 && <Plate depth={1} />}
        <div data-unica-toast-item={front.id} key={front.id}>
          <Item
            entry={front}
            summary={plates > 0 ? messages.summary(entries.length, hiddenIssues) : undefined}
            dismiss={dismiss}
          />
        </div>
      </div>
    );
  }
  const ordered = top ? [...entries].reverse() : entries;
  const timelines = ordered.map(({ id: item }) => ({
    start: `--_toast-start-${item}`,
    end: `--_toast-end-${item}`,
  }));
  return (
    <div className="unica-toast-reading">
      <div
        className="unica-toast-list unica-scrollbar unica-scrollbar--compact"
        id={id}
        role="group"
        aria-label={messages.listLabel}
        tabIndex={0}
        style={
          {
            '--_toast-timelines': timelines.flatMap(({ start, end }) => [start, end]).join(', '),
            '--_toast-reading-order': ordered.length + 1,
          } as CSSProperties
        }
      >
        <div className="unica-toast-track">
          {ordered.map((entry, index) => (
            <Fragment key={entry.id}>
              <div
                aria-hidden="true"
                className="unica-toast-slot-start"
                style={{ '--_toast-slot-timeline': timelines[index]?.start } as CSSProperties}
              />
              <div
                className="unica-toast-list-item"
                data-unica-toast-item={entry.id}
                data-unica-toast-before-depth={Math.min(index, 3) || undefined}
                data-unica-toast-after-depth={Math.min(ordered.length - index - 1, 3) || undefined}
                style={
                  {
                    '--_toast-row-start': timelines[index]?.start,
                    '--_toast-row-end': timelines[index]?.end,
                    '--_toast-before-end': timelines[index - 1]?.end,
                    '--_toast-after-start': timelines[index + 1]?.start,
                    '--_toast-start-order': index + 1,
                    '--_toast-end-order': ordered.length - index,
                  } as CSSProperties
                }
              >
                <div className="unica-toast-leading-cover">
                  <div className="unica-toast-trailing-cover">
                    <div className="unica-toast-projection">
                      <Item entry={entry} dismiss={dismiss} />
                    </div>
                  </div>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="unica-toast-slot-end"
                style={{ '--_toast-slot-timeline': timelines[index]?.end } as CSSProperties}
              />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function Plate({ depth }: { readonly depth: 1 | 2 }): ReactElement {
  return (
    <div
      className="unica-toast-plate"
      data-unica-toast-depth={depth}
      data-surface="overlay"
      aria-hidden="true"
    />
  );
}

export function ToastDock({
  controls,
  count,
  expanded,
  top,
  messages,
  toggle,
  clear,
}: {
  readonly controls: string;
  readonly count: number;
  readonly expanded: boolean;
  readonly top: boolean;
  readonly messages: ToastMessages;
  readonly toggle: () => void;
  readonly clear: () => void;
}): ReactElement {
  return (
    <div
      className="unica-toast-dock"
      data-surface="overlay"
      role="group"
      aria-label={messages.actionsLabel}
    >
      <Button
        className="unica-toast-dismiss-all"
        variant="ghost"
        tone="neutral"
        size="s"
        type="button"
        aria-label={messages.dismissAllLabel(count)}
        onClick={clear}
      >
        {messages.dismissAll}
      </Button>
      <Divider orientation="vertical" className="unica-toast-dock-divider" />
      <IconButton
        className="unica-toast-stack-toggle"
        variant="ghost"
        tone="neutral"
        size="s"
        type="button"
        icon={top === expanded ? chevronUp : chevronDown}
        aria-label={expanded ? messages.collapse(count) : messages.expand(count)}
        aria-controls={controls}
        aria-expanded={expanded}
        onClick={toggle}
      />
    </div>
  );
}
