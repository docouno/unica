import {
  Alert,
  AlertActions,
  AlertClose,
  AlertDescription,
  AlertTitle,
  Code,
  defineGlyph,
  Link,
} from '@docouno/unica';
import type { AlertStatus, GlyphSvgProps } from '@docouno/unica';
import type { JSX } from 'react';
import { Button, IconButton } from '../../../src/prototypes/button/button.proto.js';
import { Card } from '../../../src/prototypes/card/card.proto.js';

const statuses: readonly AlertStatus[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const sizes = ['s', 'm', 'l'] as const;

function Mark(props: GlyphSvgProps): JSX.Element {
  return (
    <svg {...props} viewBox="0 0 16 16">
      <rect x="4" y="4" width="8" height="8" fill="currentColor" />
    </svg>
  );
}

function NoMark(): null {
  return null;
}

const custom = defineGlyph(Mark);
const denied = defineGlyph(Mark, () => null);
const dismiss = <AlertClose aria-label="Dismiss notice" onClose={() => {}} />;

export default function AlertMaterialFixture(): JSX.Element {
  return (
    <div style={{ background: 'var(--bg-canvas)', padding: 12 }}>
      <div
        data-testid="paint"
        style={{
          background:
            document.documentElement.dataset.surface === 'overlay'
              ? 'var(--bg-overlay)'
              : 'var(--bg-canvas)',
        }}
      >
        {statuses.map((status) => (
          <Alert key={status} role="none" status={status} data-testid={status}>
            <AlertTitle>Server maintenance</AlertTitle>
            <AlertDescription>Read the maintenance schedule.</AlertDescription>
          </Alert>
        ))}
        {sizes.map((size) => (
          <Alert
            key={size}
            role="none"
            status="warning"
            size={size}
            close={dismiss}
            data-testid={size}
          >
            <AlertTitle>Review a long workspace identifier before continuing</AlertTitle>
            <AlertDescription>
              <Code>workspace_configuration_validation_2026_11_16_unresolved_reference</Code>
            </AlertDescription>
            <AlertActions>
              <Button size="s" variant="secondary" tone="neutral">
                Review configuration
              </Button>
              <Button size="s" variant="ghost" tone="neutral">
                Keep settings
              </Button>
            </AlertActions>
          </Alert>
        ))}
        <Alert role="none" status="danger" data-testid="adapter-null" icon={denied}>
          Adapter returns nothing
        </Alert>
        <Alert role="none" status="danger" data-testid="component-null" icon={NoMark}>
          Component returns nothing
        </Alert>
        <Alert role="none" data-testid="neutral-null" icon={denied}>
          No glyph column
        </Alert>
        <Alert role="none" data-testid="custom-glyph" icon={custom}>
          Custom glyph
        </Alert>
        <Alert role="none" status="danger" data-testid="context">
          <AlertTitle>Retry deployment</AlertTitle>
          <AlertDescription>
            <Link href="#guide" data-testid="inherit-link" tone="inherit">
              Read <Code data-testid="inherit-code">retry</Code>
            </Link>{' '}
            <Code data-testid="explicit-code" status="info">
              explicit status
            </Code>
          </AlertDescription>
          <AlertActions>
            <Button data-testid="neutral-action" variant="secondary" tone="neutral">
              Retry{' '}
              <Code plate={false} data-testid="button-code">
                retry
              </Code>
            </Button>
            <IconButton
              data-testid="neutral-icon-action"
              variant="ghost"
              tone="neutral"
              aria-label="Details"
              icon={custom}
            />
            <Button data-testid="explicit-action" variant="secondary" tone="danger">
              Cancel
            </Button>
            <Button data-testid="primary-action" variant="primary" tone="neutral">
              Submit
            </Button>
          </AlertActions>
          <Card>
            <Link href="#guide" data-testid="card-link" tone="inherit">
              Card content
            </Link>
          </Card>
          <div data-surface="overlay">
            <Link href="#guide" data-testid="overlay-link" tone="inherit">
              Floating panel
            </Link>
          </div>
          <Alert role="none" status="success">
            <Link href="#guide" data-testid="nested-link" tone="inherit">
              Nested feedback
            </Link>
          </Alert>
          <Link href="#guide" data-testid="restored-link" tone="inherit">
            Outer ink restored
          </Link>
        </Alert>
        <Link href="#guide" data-testid="outside-link" tone="inherit">
          Outside the alert
        </Link>
        <Button data-testid="outside-neutral-action" variant="secondary" tone="neutral">
          Ordinary action
        </Button>
        <Button data-testid="outside-explicit-action" variant="secondary" tone="danger">
          Ordinary danger
        </Button>
        <Button data-testid="outside-primary-action" variant="primary" tone="neutral">
          Ordinary primary
        </Button>
      </div>
    </div>
  );
}
