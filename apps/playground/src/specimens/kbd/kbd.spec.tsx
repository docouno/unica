import { Kbd, KbdGroup } from '@docouno/unica';
import type { KbdSize } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { previewProps, previewText } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import { Button } from '../../prototypes/button/button.proto.js';
import type { ButtonTone, ButtonVariant } from '../../prototypes/button/button.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import { Title } from '../../prototypes/title/title.proto.js';
import { GlobalSearch } from '../../prototypes/app-shell/app-shell.proto.js';
import { MenuPreview } from '../../prototypes/menu/menu.proto.js';
import { Tooltip } from '../../prototypes/tooltip/tooltip.proto.js';
import './kbd.examples.css';

function ExampleRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="kbd-example-row">
      <span className="kbd-example-label">{label}</span>
      <div className="kbd-example-content">{children}</div>
    </div>
  );
}
function SearchChord({
  size = 'inherit',
  compact = false,
}: {
  readonly size?: KbdSize;
  readonly compact?: boolean;
}): ReactElement {
  return (
    <KbdGroup size={size} separator={compact ? '' : '+'}>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  );
}
function Keycaps(): ReactElement {
  return (
    <div className="kbd-example-stack">
      <ExampleRow label="Letters & marks">
        <Kbd size="m">K</Kbd>
        <Kbd size="m">Z</Kbd>
        <Kbd size="m">/</Kbd>
        <Kbd size="m">+</Kbd>
        <Kbd size="m">F12</Kbd>
      </ExampleRow>
      <ExampleRow label="Modifiers">
        <Kbd size="m">⌘</Kbd>
        <Kbd size="m">⌥</Kbd>
        <Kbd size="m">⌃</Kbd>
        <Kbd size="m">⇧</Kbd>
        <Kbd size="m">Ctrl</Kbd>
        <Kbd size="m">Alt</Kbd>
      </ExampleRow>
      <ExampleRow label="Navigation">
        <Kbd size="m">←</Kbd>
        <Kbd size="m">↑</Kbd>
        <Kbd size="m">↓</Kbd>
        <Kbd size="m">→</Kbd>
        <Kbd size="m">⇥</Kbd>
        <Kbd size="m">↵</Kbd>
        <Kbd size="m">⌫</Kbd>
      </ExampleRow>
      <ExampleRow label="Named keys">
        <Kbd size="m">Esc</Kbd>
        <Kbd size="m">Enter</Kbd>
        <Kbd size="m">Shift</Kbd>
        <Kbd size="m">Space</Kbd>
        <Kbd size="m">Page Down</Kbd>
      </ExampleRow>
      <Text size="caption-l" color="muted">
        A key or a short input hint. Neutral, non-interactive, and never a separate Tab stop.
      </Text>
    </div>
  );
}
function Sizing(): ReactElement {
  return (
    <div className="kbd-example-stack">
      {(['s', 'm', 'l'] as const).map((size, index) => (
        <ExampleRow key={size} label={`${size.toUpperCase()} · ${20 + index * 4}px`}>
          <Kbd size={size}>K</Kbd>
          <Kbd size={size}>⌘</Kbd>
          <Kbd size={size}>Enter</Kbd>
          <SearchChord size={size} />
        </ExampleRow>
      ))}
      <div className="kbd-example-inline">
        <Text size="caption-l">
          Press <Kbd>Esc</Kbd> to dismiss.
        </Text>
        <Text size="body-s">
          Press <SearchChord /> to search.
        </Text>
        <Text size="body-m">
          Use <Kbd>Tab</Kbd> to move between fields.
        </Text>
        <Text size="body-l">
          Press <Kbd>Enter</Kbd> to continue.
        </Text>
        <Title as="h3" size="heading-m">
          Find anything with <SearchChord compact />
        </Title>
      </div>
      <Text size="caption-l" color="muted">
        Inline keys inherit the surrounding type and line height. The standalone sizes grow with the
        text-scale control.
      </Text>
    </div>
  );
}
function Notation(): ReactElement {
  return (
    <div className="kbd-example-stack">
      <ExampleRow label="macOS · compact">
        <KbdGroup size="s" separator="">
          <Kbd>⇧</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </ExampleRow>
      <ExampleRow label="Windows / Linux">
        <KbdGroup size="s">
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </ExampleRow>
      <ExampleRow label="Sequential keys">
        <KbdGroup size="s" separator="then">
          <Kbd>G</Kbd>
          <Kbd>I</Kbd>
        </KbdGroup>
      </ExampleRow>
      <ExampleRow label="Sequential chords">
        <KbdGroup size="s" separator="then">
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>C</Kbd>
          </KbdGroup>
        </KbdGroup>
      </ExampleRow>
      <ExampleRow label="Alternative keys">
        <span className="kbd-example-alternatives">
          <Kbd size="s">Enter</Kbd>
          <span>or</span>
          <Kbd size="s">Space</Kbd>
        </span>
      </ExampleRow>
      <ExampleRow label="Compact hint">
        <Kbd size="s">⌘K</Kbd>
        <Text as="span" size="caption-l" color="muted">
          One plate for tight search and menu chrome.
        </Text>
      </ExampleRow>
      <ExampleRow label="Local key names">
        <KbdGroup size="s">
          <Kbd label="Control">Strg</Kbd>
          <Kbd>Umschalt</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </ExampleRow>
      <Text size="caption-l" color="muted">
        The application chooses the platform and wording. “Then” means release the first step before
        the next.
      </Text>
    </div>
  );
}

type OwnerState = 'rest' | 'hover' | 'active' | 'focus' | 'disabled' | 'loading';
function ActionContext(): ReactElement {
  const [state, setState] = useState<OwnerState>('rest');
  const [variant, setVariant] = useState<ButtonVariant>('primary');
  const [tone, setTone] = useState<ButtonTone>('accent');
  const [count, setCount] = useState(0);
  return (
    <div className="kbd-example-stack">
      <div className="kbd-example-controls">
        <label>
          Action state
          <select value={state} onChange={(event) => setState(event.target.value as OwnerState)}>
            {['rest', 'hover', 'active', 'focus', 'disabled', 'loading'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Weight
          <select
            value={variant}
            onChange={(event) => setVariant(event.target.value as ButtonVariant)}
          >
            {['primary', 'secondary', 'ghost'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Tone
          <select value={tone} onChange={(event) => setTone(event.target.value as ButtonTone)}>
            {['accent', 'neutral', 'danger'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="kbd-example-action-preview">
        <Button
          variant={variant}
          tone={tone}
          disabled={state === 'disabled'}
          loading={state === 'loading'}
          previewState={
            state === 'disabled' || state === 'loading' || state === 'rest' ? undefined : state
          }
          onClick={() => setCount(count + 1)}
        >
          <span className="kbd-example-action-label">
            {tone === 'danger' ? 'Remove' : 'Run command'}
            <Kbd aria-hidden="true">↵</Kbd>
          </span>
        </Button>
        <Text size="caption-l" color="muted" aria-live="polite">
          {state === 'loading'
            ? 'Command in progress…'
            : state === 'disabled'
              ? 'Command unavailable.'
              : count
                ? `Activated ${count} ${count === 1 ? 'time' : 'times'}.`
                : 'Try Tab, Enter, Space, or click.'}
        </Text>
      </div>
      <div className="kbd-example-content">
        <Button size="s" variant="secondary" tone="neutral">
          <span className="kbd-example-action-label">
            Save<Kbd aria-hidden="true">⌘S</Kbd>
          </span>
        </Button>
        <Button size="s" variant="ghost" tone="neutral">
          <span className="kbd-example-action-label">
            Find
            <SearchChord compact />
          </span>
        </Button>
        <Button size="s" variant="secondary" tone="neutral" disabled>
          <span className="kbd-example-action-label">
            Save<Kbd aria-hidden="true">⌘S</Kbd>
          </span>
        </Button>
      </div>
      <Text size="caption-l" color="muted">
        The controls pin the action’s appearance. Focus and movement belong to the action; loading
        hides its full content. Shortcut hints do not register hotkeys.
      </Text>
    </div>
  );
}
function Surfaces(): ReactElement {
  return (
    <div className="kbd-example-stack">
      <div className="kbd-example-surface" data-plate="canvas">
        <span>On a canvas</span>
        <SearchChord size="s" />
      </div>
      <div className="kbd-example-surface" data-plate="surface">
        <span>On a surface</span>
        <SearchChord size="s" />
      </div>
      <div className="kbd-example-surface" data-plate="control">
        <span>On a field</span>
        <Kbd size="s">⌘K</Kbd>
      </div>
      <div className="kbd-example-search">
        <GlobalSearch placeholder="Search documents…" />
      </div>
      <Text size="caption-l" color="muted">
        The same neutral plate remains legible across surfaces. The real search input above keeps
        the shortcut secondary to its value.
      </Text>
    </div>
  );
}
function OverlayContext(): ReactElement {
  return (
    <div className="kbd-example-overlay">
      <Tooltip shortcut="⌘B">Bold</Tooltip>
      <MenuPreview
        label="Shortcut appearance samples"
        className="kbd-example-menu"
        items={[
          { id: 'find', label: 'Find a command', shortcut: '⌘K' },
          { id: 'palette', label: 'Open command palette', shortcut: '⇧⌘P', preview: 'hover' },
          { id: 'separator', type: 'separator' },
          { id: 'diff', label: 'Compare revisions', shortcut: '⌘D', disabled: true },
        ]}
      />
      <Text size="caption-l" color="muted">
        Static tooltip and menu surfaces; the highlighted row is pinned for comparison. The disabled
        command keeps a quiet, readable hint.
      </Text>
    </div>
  );
}
function Reflow(): ReactElement {
  return (
    <div className="kbd-example-stack">
      <div className="kbd-example-reference">
        <div>
          <span>Open the command palette</span>
          <KbdGroup size="s">
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
        </div>
        <div>
          <span>Go to inbox</span>
          <KbdGroup size="s" separator="then">
            <Kbd>G</Kbd>
            <Kbd>I</Kbd>
          </KbdGroup>
        </div>
        <div>
          <span>Custom command</span>
          <Text as="span" size="caption-l" color="muted">
            Not assigned
          </Text>
        </div>
      </div>
      <Text size="body-s">
        To open the palette, press{' '}
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
        . The whole chord moves to the next line when needed.
      </Text>
      <div className="kbd-example-steps" dir="ltr">
        <KbdGroup size="s">
          <Kbd>Control</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <span>
          then{' '}
          <KbdGroup size="s">
            <Kbd>Control</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>C</Kbd>
          </KbdGroup>
        </span>
      </div>
      <div
        className="kbd-example-overflow"
        dir="ltr"
        tabIndex={0}
        role="region"
        aria-label="Long shortcut example"
      >
        <KbdGroup size="s">
          <Kbd>Control</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>Page Down</Kbd>
        </KbdGroup>
      </div>
      <Text size="caption-l" color="muted">
        Shortcuts stay left-to-right in RTL. Long sequences break between steps; an unusually wide
        reference can scroll without shortening a key name. An unassigned command has no empty
        keycap.
      </Text>
    </div>
  );
}

export default defineComponent({
  id: 'kbd',
  title: 'Kbd',
  category: 'Typography',
  status: 'UI',
  summary: 'Keycaps for individual keys and compact keyboard hints.',
  componentName: 'Kbd',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Scale relative to the surrounding text.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: '⌘',
      description: 'A key label or a recognized symbol.',
      examples: ['⌘', 'Enter', 'Esc', '→', ''],
    },
    label: {
      kind: 'string',
      group: 'Semantics',
      default: '',
      description: 'Spoken label for a custom glyph or localized key.',
      examples: ['', 'Commande'],
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { children: '' },
      affects: ['label'],
      reason: 'An empty keycap has no rendered content to label.',
    },
  ],
  render: ({ ctx, values: { children, label, size } }) => (
    <Kbd {...ctx.subject} {...(label ? { label } : {})} size={size}>
      {children}
    </Kbd>
  ),
  code: ({ children, ...props }) =>
    `<Kbd${previewProps(props, { size: 'inherit', label: '' })}>${previewText(children)}</Kbd>`,
  matrixViews: [
    {
      id: 'sizing',
      rows: 'size',
      cols: 'children',
      title: 'Size & inline rhythm',
      reference: () => <Sizing />,
    },
  ],
  cases: [
    {
      id: 'keys',
      title: 'Keycaps & vocabulary',
      kind: 'behavior',
      render: () => <Keycaps />,
    },
    {
      id: 'notation',
      title: 'Chords & sequences',
      kind: 'behavior',
      render: () => <Notation />,
    },
    {
      id: 'surfaces',
      title: 'Surfaces & search',
      kind: 'surface',
      render: () => <Surfaces />,
    },
    {
      id: 'overlay',
      mode: 'pinned',
      title: 'Menu & tooltip',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <OverlayContext />,
    },
    {
      id: 'reflow',
      title: 'Narrow layouts & long names',
      kind: 'content',
      render: () => <Reflow />,
    },
  ],
  usage: [
    {
      id: 'actions',
      code: `<Button variant="secondary">
  Search <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
</Button>`,
      title: 'Inside an action',
      render: () => <ActionContext />,
    },
  ],
});
