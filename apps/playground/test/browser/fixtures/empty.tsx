import type { ReactElement } from 'react';
import {
  Button,
  Card,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
  UnicaProvider,
  defineGlyph,
} from '@docouno/unica';
import type { EmptySize } from '@docouno/unica';

const glyph = defineGlyph((props) => (
  <svg {...props} viewBox="0 0 16 16">
    <path d="M2 2h12v12H2z" />
  </svg>
));
const absentGlyph = defineGlyph(
  () => null,
  () => null,
);

function Layout({ size }: { readonly size: EmptySize }): ReactElement {
  return (
    <Empty size={size} align="start" data-testid={`layout-${size}`}>
      <EmptyMedia icon={glyph} color="danger" data-part="media" />
      <EmptyTitle tabIndex={-1} data-part="title">
        No checks ran
      </EmptyTitle>
      <EmptyDescription data-part="description">
        Check the deployment enterprise-production-release-54d91afac12d19cde90c9a15129cbb8b6c12.
      </EmptyDescription>
      <EmptyActions data-part="actions">
        <Button variant="secondary">Run deployment checks</Button>
        <Link href="#settings">Open deployment settings</Link>
      </EmptyActions>
    </Empty>
  );
}

export default function EmptyFixture(): ReactElement {
  return (
    <UnicaProvider overrides={{ Icon: { size: 's' } }}>
      <div style={{ background: 'var(--bg-canvas)', padding: 12 }}>
        <Card style={{ display: 'grid', gap: 24 }}>
          <Layout size="s" />
          <Layout size="m" />
          <Layout size="l" />
        </Card>
        <Popover>
          <PopoverTrigger>Show floating message</PopoverTrigger>
          <PopoverContent
            aria-label="Floating message"
            style={{ maxInlineSize: 'min(20rem, 85vw)' }}
          >
            <Layout size="m" />
          </PopoverContent>
        </Popover>

        <div data-testid="illustrations">
          <Empty size="s">
            <EmptyMedia icon={glyph} color="warning">
              <svg
                role="img"
                aria-label="Landscape"
                viewBox="0 0 240 180"
                width="240"
                height="180"
              />
            </EmptyMedia>
          </Empty>
          <Empty size="l">
            <EmptyMedia>
              <img alt="Portrait" src="/assets/empty-portrait.png" width="640" height="960" />
            </EmptyMedia>
          </Empty>
          <Empty size="l">
            <EmptyMedia>
              <svg role="img" aria-label="Scalable portrait" viewBox="0 0 180 270" />
            </EmptyMedia>
          </Empty>
          <Empty
            size="s"
            align="start"
            dir="rtl"
            style={{ inlineSize: 64 }}
            data-testid="narrow-illustration"
          >
            <EmptyMedia>
              <svg
                role="img"
                aria-label="Scalable landscape"
                viewBox="0 0 240 180"
                width=" 100% "
                height=" 100% "
              />
            </EmptyMedia>
          </Empty>
        </div>

        <table aria-label="History" style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>
                <Empty size="s" data-testid="compact">
                  <EmptyMedia hidden icon={glyph} />
                  <EmptyMedia icon={absentGlyph} />
                  <EmptyTitle hidden>History</EmptyTitle>
                  <EmptyDescription>No events.</EmptyDescription>
                  <EmptyActions hidden>
                    <Button>Hidden</Button>
                  </EmptyActions>
                </Empty>
              </td>
            </tr>
          </tbody>
        </table>

        <Empty data-testid="no-content" />
        <Empty data-testid="skipped-title">
          <EmptyMedia data-part="media" icon={glyph} />
          <EmptyTitle hidden>Hidden title</EmptyTitle>
          <EmptyDescription data-part="description">Only supporting text.</EmptyDescription>
        </Empty>

        <Empty popover="manual" data-testid="native-empty">
          <EmptyDescription>Available in a native popover.</EmptyDescription>
        </Empty>
        <Empty data-testid="native-parts">
          <EmptyMedia icon={glyph} popover="manual" data-testid="native-media" />
          <EmptyDescription>Content in normal flow.</EmptyDescription>
          <EmptyActions popover="manual" data-testid="native-actions">
            <Button>Recover</Button>
          </EmptyActions>
        </Empty>

        <form aria-label="Recovery actions">
          <label>
            Reason <input name="reason" defaultValue="expired" />
          </label>
          <Empty>
            <EmptyTitle>Reports unavailable</EmptyTitle>
            <EmptyActions>
              <Button
                onClick={(event) => event.currentTarget.setAttribute('data-activated', 'yes')}
              >
                Command
              </Button>
              <Button disabled loading>
                Disabled
              </Button>
              <Button
                loading
                onClick={(event) => event.currentTarget.setAttribute('data-activated', 'yes')}
              >
                Busy command
              </Button>
              <Button asChild loading>
                <a
                  href="#busy"
                  onClick={(event) => event.currentTarget.setAttribute('data-activated', 'yes')}
                >
                  Busy destination
                </a>
              </Button>
              <Link href="#reports">Report list</Link>
              <Button type="submit" name="action" value="retry">
                Submit
              </Button>
              <Button type="reset">Reset</Button>
            </EmptyActions>
          </Empty>
        </form>
      </div>
    </UnicaProvider>
  );
}
