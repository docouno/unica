import { Kbd, KbdGroup, Tooltip } from '@docouno/unica';
import { TableIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import { Button } from '@docouno/unica';
import { Autocomplete } from '../../../src/prototypes/combobox/combobox.proto.js';
import { MenuRows, MenuSurface } from '../../../src/prototypes/menu/menu.proto.js';
import KbdSsrFixture from './kbd-ssr.js';

const typeSizes = ['caption-l', 'body-s', 'body-m', 'body-l', 'heading-m'] as const;
const capSizes = ['s', 'm', 'l'] as const;

const longMenuShortcut = 'Control Shift International Keyboard';

function MaterialSample({ surface }: { readonly surface: 'base' | 'overlay' }) {
  return (
    <div
      data-surface={surface}
      data-testid={`material-${surface}`}
      style={{
        background: surface === 'base' ? 'var(--bg-canvas)' : 'var(--bg-overlay)',
        backdropFilter: surface === 'overlay' ? 'var(--_overlay-backdrop)' : undefined,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: 12,
        alignItems: 'center',
      }}
    >
      <KbdGroup size="s">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
      <Button>
        Search{' '}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
    </div>
  );
}

function Actions() {
  const [state, setState] = useState('ready');
  const [activations, setActivations] = useState(0);
  return (
    <form data-testid="hint-form">
      <input type="hidden" name="document" value="release" />
      <label>
        Action state{' '}
        <select value={state} onChange={(event) => setState(event.currentTarget.value)}>
          <option value="ready">Ready</option>
          <option value="loading">Loading</option>
          <option value="disabled">Disabled</option>
        </select>
      </label>
      <button type="button">Before hint</button>
      <Kbd>⌘K</Kbd>
      <Button
        aria-label="Run command"
        loading={state === 'loading'}
        disabled={state === 'disabled'}
        onClick={() => setActivations((count) => count + 1)}
      >
        Run command <Kbd aria-hidden="true">⌘K</Kbd>
      </Button>
      <button type="submit" name="intent" value="save">
        Save document
      </button>
      <output data-testid="activations">{activations}</output>
    </form>
  );
}

function Hydration() {
  const root = useRef<HTMLDivElement>(null);
  const errors = useRef<HTMLOutputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (root.current) {
            hydrateRoot(root.current, <KbdSsrFixture />, {
              onRecoverableError(error) {
                if (errors.current) {
                  errors.current.textContent += String(error);
                }
              },
            });
          }
        }}
      >
        Hydrate shortcuts
      </button>
      <div data-testid="ssr-root" ref={root} />
      <output data-testid="hydration-errors" ref={errors} />
    </>
  );
}

export default function KbdFixture() {
  return (
    <div
      style={{
        background: 'var(--bg-canvas)',
        color: 'var(--fg-primary)',
        fontFamily: 'var(--font-family-base)',
      }}
    >
      <MaterialSample surface="base" />
      <MaterialSample surface="overlay" />
      {typeSizes.map((size) => (
        <div
          key={size}
          data-testid={size}
          style={{
            fontSize: `var(--text-size-${size})`,
            lineHeight: `var(--text-size-${size}-lh)`,
          }}
        >
          <div>Press K to search.</div>
          <div>
            Press <Kbd>K</Kbd> to search.
          </div>
          <div>
            Press <Kbd>⌘</Kbd> to search.
          </div>
        </div>
      ))}
      <div data-testid="explicit-sizes">
        {capSizes.map((size) => (
          <Kbd key={size} size={size}>
            K
          </Kbd>
        ))}
        <Kbd size="m">Enter</Kbd>
        <Kbd size="m" data-testid="mixed">
          ⌘K
        </Kbd>
        <KbdGroup size="l" data-testid="nested">
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd size="s">K</Kbd>
          </KbdGroup>
          <Kbd>Enter</Kbd>
        </KbdGroup>
      </div>
      <div data-testid="semantics">
        <Kbd data-testid="plain">Page Down</Kbd>
        <Kbd data-testid="localized" label="Commande" lang="fr">
          ⌘
        </Kbd>
        <Kbd data-testid="suppressed" aria-hidden="true" label="Duplicate Command">
          ⌘
        </Kbd>
        <KbdGroup data-testid="compact" separator="">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <KbdGroup data-testid="sequence" separator="then">
          <Kbd hidden>Tab</Kbd>
          <Kbd>↵</Kbd>
          <Kbd>↩</Kbd>
          <KbdGroup hidden>
            <Kbd>Space</Kbd>
          </KbdGroup>
        </KbdGroup>
        <Kbd data-testid="hidden" hidden>
          Esc
        </Kbd>
      </div>
      <Actions />
      <div
        style={{ fontSize: 'var(--text-size-body-s)', lineHeight: 'var(--text-size-body-s-lh)' }}
      >
        <div data-testid="reflow" style={{ inlineSize: 'min(100%, 230px)' }}>
          <span style={{ display: 'inline-block' }}>Open the command palette</span>{' '}
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
          </KbdGroup>
        </div>
        <div
          aria-label="Extended shortcut"
          dir="ltr"
          role="region"
          style={{ inlineSize: 'min(100%, 10rem)', overflowX: 'auto' }}
          tabIndex={0}
        >
          <KbdGroup size="m">
            <Kbd>Control</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>Page Down</Kbd>
          </KbdGroup>
        </div>
      </div>
      <Tooltip
        data-testid="shortcut-tooltip"
        label="Duplicate the selection"
        style={{ inlineSize: 178 }}
        shortcut={
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>Page Down</Kbd>
          </KbdGroup>
        }
      >
        <Button variant="ghost" tone="neutral">
          Duplicate selection
        </Button>
      </Tooltip>
      <MenuSurface data-testid="shortcut-menu" style={{ inlineSize: 400 }}>
        <MenuRows
          role="menu"
          items={[
            { id: 'long', label: 'Open help', shortcut: longMenuShortcut },
            { id: 'disabled', label: 'Locked command', shortcut: '⌘D', disabled: true },
          ]}
        />
      </MenuSurface>
      <Autocomplete
        label="Insert a block"
        browsable
        filter={null}
        options={[
          {
            value: 'release',
            label: 'International release checklist',
            description: 'Track deployment readiness, rollback owners, and follow-up checks.',
            shortcut: '/release',
            icon: TableIcon,
          },
          {
            value: 'locked',
            label: 'Locked checklist',
            shortcut: '/locked',
            disabled: true,
          },
        ]}
      />
      <Hydration />
    </div>
  );
}
