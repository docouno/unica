import { Button, IconButton } from '@docouno/unica';
import { useCallback, useRef, useState } from 'react';
import type { ComponentPropsWithRef, JSX, RefCallback } from 'react';
import { CommandGlyph } from '../button-glyph.js';

interface AvailabilityActionProps {
  readonly label: string;
  readonly id: string;
  readonly loading: boolean;
  readonly disabled?: boolean | undefined;
  readonly record: (entry: unknown) => void;
}

function AvailabilityAction({
  label,
  id,
  loading,
  disabled,
  record,
}: AvailabilityActionProps): JSX.Element {
  const trace = (stage: string): void => record([id, stage]);
  return (
    <Button
      disabled={disabled}
      loading={loading}
      onPointerDownCapture={() => trace('pointer down capture')}
      onPointerDown={() => trace('pointer down')}
      onMouseDownCapture={() => trace('mouse down capture')}
      onMouseDown={() => trace('mouse down')}
      onClickCapture={() => trace('click capture')}
      onClick={() => trace('click')}
      onContextMenuCapture={() => trace('context menu capture')}
      onContextMenu={(event) => {
        event.preventDefault();
        trace('context menu');
      }}
    >
      <span data-testid={id + '-label'}>{label}</span>
    </Button>
  );
}

function NativeActions(): JSX.Element {
  const [activity, setActivity] = useState<unknown[]>([]);
  const [pending, setPending] = useState(false);
  const [locked, setLocked] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const local = useRef<HTMLButtonElement>(null);
  const controlled = useRef<HTMLButtonElement>(null);

  function record(event: unknown): void {
    setActivity((previous) => [...previous, event]);
  }

  return (
    <section aria-label="Native actions">
      <button type="button" onClick={() => setPending((value) => !value)}>
        Toggle pending actions
      </button>
      <button type="button" onClick={() => setLocked((value) => !value)}>
        Toggle fieldset lock
      </button>
      <button type="button" onClick={() => setActivity([])}>
        Clear native activity
      </button>
      <form
        id="button-form"
        onSubmit={(event) => {
          event.preventDefault();
          const { submitter } = event.nativeEvent;
          const numbers = [...new FormData(event.currentTarget, submitter)];
          record(['submit', submitter?.textContent?.trim(), numbers]);
        }}
      >
        <input name="query" aria-label="Search query" required defaultValue="Initial" />
        <Button pressed={undefined} onClick={() => record('command')}>
          Ordinary command
        </Button>
        <Button
          ref={local}
          defaultPressed={false}
          name="format"
          value="bold"
          loading={pending}
          onClick={() => record('local click')}
          onPressedChange={(value) => record(['local', value])}
        >
          Local toggle
        </Button>
        <IconButton
          aria-label="Controlled toggle"
          icon={CommandGlyph}
          pressed={false}
          defaultPressed
          ref={controlled}
          onPressedChange={(value) => record(['controlled', value])}
        />
        <Button
          defaultPressed={false}
          onClick={(event) => event.preventDefault()}
          onPressedChange={(value) => record(['cancelled toggle', value])}
        >
          Cancel toggle
        </Button>
        <Button type="reset" onClick={(event) => event.preventDefault()}>
          Cancel reset
        </Button>
        <Button loading={pending} type="reset">
          Restore query
        </Button>
      </form>
      <Button
        form="button-form"
        type="submit"
        name="intent"
        value="save"
        formAction="#save-query"
        formMethod="post"
        formEncType="multipart/form-data"
        loading={pending}
        onClick={() => record('submit click')}
      >
        Save query
      </Button>
      <Button form="button-form" type="submit" name="intent" value="draft">
        Save draft
      </Button>
      <button
        type="button"
        onClick={() => {
          local.current?.click();
          local.current?.click();
          controlled.current?.click();
          controlled.current?.click();
        }}
      >
        Run toggle batch
      </button>
      <div
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setExpanded(false);
            record('ancestor escape');
          }
        }}
      >
        <Button
          loading={pending}
          aria-expanded={expanded}
          aria-haspopup="menu"
          aria-controls="button-menu"
          onFocus={() => record('focus')}
          onAuxClickCapture={() => record('aux capture')}
          onClickCapture={() => record('click capture')}
          onPointerDownCapture={() => record('pointer capture')}
          onKeyDownCapture={(event) => record(['key capture', event.key])}
          onClick={() => {
            setExpanded(true);
            record('menu click');
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              setExpanded(true);
              record('menu keys');
            }
          }}
        >
          More options
        </Button>
        <div id="button-menu" role="menu" aria-label="Options" hidden={!expanded}>
          <button type="button" role="menuitem">
            Inspect
          </button>
        </div>
        <Button loading={pending} popoverTarget="native-button-popover">
          Native popover invoker
        </Button>
        <button type="button">After menu triggers</button>
      </div>
      <div id="native-button-popover" popover="auto">
        Popover contents
      </div>
      <fieldset disabled={locked}>
        <legend>
          Group{' '}
          <AvailabilityAction id="legend" label="Legend action" loading={pending} record={record} />
        </legend>
        <AvailabilityAction
          id="fieldset"
          label="Fieldset action"
          loading={pending}
          record={record}
        />
      </fieldset>
      <AvailabilityAction
        id="disabled"
        label="Disabled action"
        loading={pending}
        disabled
        record={record}
      />
      <output data-testid="native-activity">{JSON.stringify(activity)}</output>
    </section>
  );
}

type RouteProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & {
  readonly to: string;
  readonly onRoute: () => void;
};

function TestRoute({ to, onRoute, ref, onClick, ...props }: RouteProps): JSX.Element {
  return (
    <a
      {...props}
      href={to}
      ref={ref}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          window.history.pushState(null, '', to);
          onRoute();
        }
      }}
    />
  );
}

function LinkActions(): JSX.Element {
  const [state, setState] = useState<'ready' | 'pending' | 'disabled'>('ready');
  const [cancel, setCancel] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [calls, setCalls] = useState<string[]>([]);
  const [refReport, setRefReport] = useState('');
  const outer = useRef<HTMLAnchorElement>(null);
  const inner = useRef<HTMLAnchorElement>(null);
  const attached = useRef(0);
  const cleaned = useRef(0);
  const childRef = useCallback<RefCallback<HTMLAnchorElement>>((node) => {
    if (node) {
      attached.current += 1;
      inner.current = node;
      return () => {
        cleaned.current += 1;
        inner.current = null;
      };
    }
  }, []);
  const record = (value: string): void => setCalls((previous) => [...previous, value]);

  return (
    <section aria-label="Link actions">
      <button type="button" onClick={() => setState('ready')}>
        Make route ready
      </button>
      <button type="button" onClick={() => setState('pending')}>
        Make route pending
      </button>
      <button type="button" onClick={() => setState('disabled')}>
        Disable route
      </button>
      <button type="button" onClick={() => setCancel((value) => !value)}>
        Toggle child cancellation
      </button>
      <button type="button" onClick={() => setMounted((value) => !value)}>
        Toggle route mount
      </button>
      <button type="button" onClick={() => setCalls([])}>
        Clear route activity
      </button>
      <button
        type="button"
        onClick={() =>
          setRefReport(
            JSON.stringify({
              live: outer.current === inner.current && outer.current?.isConnected === true,
              cleared: outer.current === null && inner.current === null,
              attached: attached.current,
              cleaned: cleaned.current,
            }),
          )
        }
      >
        Check route refs
      </button>
      <div>
        <button type="button">Before route</button>
        {mounted && (
          <Button
            asChild
            loading={state === 'pending'}
            disabled={state === 'disabled'}
            ref={outer}
            aria-describedby="outer-route-note"
            onClickCapture={() => record('outer capture')}
            onClick={() => record('outer')}
          >
            <TestRoute
              to="#route"
              onRoute={() => record('navigation')}
              ref={childRef}
              aria-busy="true"
              aria-disabled="true"
              aria-pressed="true"
              aria-describedby="child-route-note"
              onClickCapture={() => record('child capture')}
              onClick={(event) => {
                record('child');
                if (cancel) {
                  event.preventDefault();
                }
              }}
              onAuxClickCapture={() => record('aux capture')}
            >
              Router destination
            </TestRoute>
          </Button>
        )}
        <button type="button">After route</button>
      </div>
      <span hidden id="outer-route-note">
        General route details
      </span>
      <span hidden id="child-route-note">
        Specific route details
      </span>
      <Button asChild>
        <a href="#native-destination">Native destination</a>
      </Button>
      <Button asChild>
        <a href="?fixture=button&theme=soft-dark#native-tab">Native tab destination</a>
      </Button>
      <div id="native-destination">Native anchor target</div>
      <IconButton
        asChild
        icon={CommandGlyph}
        aria-label="Open report"
        loading={state === 'pending'}
      >
        <a href="#report" aria-label="" />
      </IconButton>
      <span id="named-command" hidden>
        Read report details
      </span>
      <IconButton aria-labelledby="named-command" icon={CommandGlyph} />
      <output data-testid="route-activity">{JSON.stringify(calls)}</output>
      <output data-testid="router-refs">{refReport}</output>
    </section>
  );
}

export default function ButtonFixture(): JSX.Element {
  return (
    <>
      <NativeActions />
      <LinkActions />
    </>
  );
}
