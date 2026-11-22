import { Alert, Button, Card, IconButton, Kbd, Spinner } from '@docouno/unica';
import { useState } from 'react';
import type { JSX } from 'react';
import { CommandGlyph } from '../button-glyph.js';

const sizes = ['s', 'm', 'l'] as const;
const variants = ['primary', 'secondary', 'ghost'] as const;
const tones = ['accent', 'neutral', 'danger'] as const;
const longWord = 'SuperficiallyUnbreakableApplicationCommandDesignationWithAdditionalText';

function Metrics(): JSX.Element {
  const [pending, setPending] = useState(false);
  return (
    <section style={{ display: 'grid', justifyItems: 'start', gap: 8 }}>
      <button type="button" onClick={() => setPending((value) => !value)}>
        Toggle metrics loading
      </button>
      {sizes.map((size) => (
        <div key={size} style={{ display: 'flex', gap: 8 }}>
          <Button
            size={size}
            iconLeft={CommandGlyph}
            loading={pending}
            data-testid={'button-' + size}
          >
            Run
          </Button>
          <IconButton
            size={size}
            aria-label={'Square ' + size}
            icon={CommandGlyph}
            loading={pending}
            data-testid={'square-' + size}
          />
        </div>
      ))}
      <div
        data-testid="wrapping-actions"
        style={{ display: 'flex', gap: 8, inlineSize: 'min(100%, 336px)', alignItems: 'start' }}
      >
        <div style={{ flex: 1, minInlineSize: 0 }}>
          <Button
            width="full"
            iconLeft={CommandGlyph}
            iconRight={CommandGlyph}
            data-testid="wrapping-command"
            loading={pending}
          >
            Export אבג {longWord} <Kbd>Enter</Kbd>
          </Button>
        </div>
        <IconButton aria-label="Nearby square" icon={CommandGlyph} data-testid="adjacent" />
      </div>
    </section>
  );
}

function Travel(): JSX.Element {
  const [actions, setActions] = useState(0);
  return (
    <section aria-label="Press travel">
      <button type="button">Before travel</button>
      <div style={{ display: 'flex', gap: 12, marginBlock: 24 }}>
        {variants.map((variant) => (
          <Button key={variant} variant={variant} onClick={() => setActions((count) => count + 1)}>
            {'Hold ' + variant}
          </Button>
        ))}
        <Button pressed onClick={() => setActions((count) => count + 1)}>
          Hold selected
        </Button>
      </div>
      <output data-testid="travel-actions">{actions}</output>
    </section>
  );
}

function Selected(): JSX.Element {
  return (
    <section
      data-testid="selected-palette"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 12 }}
    >
      {variants.flatMap((variant) =>
        tones.map((tone) => {
          const id = variant + '-' + tone;
          return (
            <div key={id} style={{ display: 'flex', gap: 8 }}>
              <Button data-testid={id + '-off'} variant={variant} tone={tone} pressed={false}>
                Toggle
              </Button>
              <Button data-testid={id + '-on'} variant={variant} tone={tone} pressed>
                Toggle
              </Button>
              <IconButton
                data-testid={id + '-icon'}
                variant={variant}
                tone={tone}
                pressed
                aria-label={'Toggle ' + id}
                icon={CommandGlyph}
              />
            </div>
          );
        }),
      )}
    </section>
  );
}

function Forced(): JSX.Element {
  return (
    <section aria-label="System colors" style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button">Before forced colors</button>
        <Button pressed loading data-testid="forced-active">
          Selected busy
        </Button>
        <Button pressed disabled loading data-testid="forced-disabled">
          Selected unavailable
        </Button>
        <Button pressed data-testid="forced-selected">
          Selected available
        </Button>
        <span data-testid="forced-standalone">
          <Spinner />
        </span>
      </div>
      {(['secondary', 'ghost'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 8 }}>
          <Button variant={variant} aria-expanded={false} data-testid={variant + '-closed'}>
            Options
          </Button>
          <Button variant={variant} aria-expanded data-testid={variant + '-expanded'}>
            Options
          </Button>
          <Button variant={variant} aria-expanded pressed data-testid={variant + '-expanded-on'}>
            Options
          </Button>
          <Button
            variant={variant}
            aria-expanded
            disabled
            data-testid={variant + '-expanded-disabled'}
          >
            Options
          </Button>
        </div>
      ))}
    </section>
  );
}

function ContextActions(): JSX.Element {
  return (
    <section aria-label="Supporting actions">
      <Button variant="ghost" data-testid="outside-neutral">
        Ordinary supporting action
      </Button>
      <Alert status="warning">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button variant="ghost" data-testid="context-neutral">
            Supporting action
          </Button>
          <Button variant="ghost" tone="accent" data-testid="context-accent">
            Accent action
          </Button>
          <Button variant="ghost" tone="danger" data-testid="context-danger">
            Destructive action
          </Button>
          <Button variant="secondary" data-testid="context-selected" pressed>
            Selected action
          </Button>
          <Button variant="ghost" data-testid="context-disabled" disabled>
            Unavailable action
          </Button>
          <Card size="s">
            <Button variant="ghost" data-testid="card-neutral">
              Card supporting action
            </Button>
          </Card>
          <div data-surface="overlay" style={{ padding: 8, backgroundColor: 'var(--bg-overlay)' }}>
            <Button variant="ghost" data-testid="overlay-neutral">
              Overlay supporting action
            </Button>
          </div>
        </div>
      </Alert>
    </section>
  );
}

export default function ButtonMaterialFixture(): JSX.Element {
  const overlay =
    typeof document !== 'undefined' && document.documentElement.dataset.surface === 'overlay';
  return (
    <div
      style={{
        display: 'grid',
        gap: 20,
        padding: 8,
        background: overlay ? 'var(--bg-overlay)' : 'var(--bg-canvas)',
      }}
    >
      <Metrics />
      <Travel />
      <Selected />
      <Forced />
      <ContextActions />
    </div>
  );
}
