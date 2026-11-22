import { Card, Divider } from '@docouno/unica';

const phrase = 'or continue with your organization’s email address';

function BoundarySample({ name, overlay }: { name: string; overlay: boolean }) {
  return (
    <div data-testid={name}>
      <Divider />
      <div
        data-color-reference=""
        style={{ borderBlockStart: `1px solid var(--border-${overlay ? 'default' : 'subtle'})` }}
      />
    </div>
  );
}

export default function DividerFixture() {
  return (
    <>
      <div data-testid="flex-row" style={{ display: 'flex', alignItems: 'center' }}>
        <span data-testid="flex-neighbor" style={{ blockSize: 30 }}>
          Formatting
        </span>
        <Divider orientation="vertical" data-testid="flex-rule" />
      </div>
      <div
        data-testid="grid-row"
        style={{ display: 'grid', gridTemplateColumns: 'max-content 1px', alignItems: 'center' }}
      >
        <span data-testid="grid-neighbor" style={{ blockSize: 44 }}>
          Metadata
        </span>
        <Divider orientation="vertical" data-testid="grid-rule" />
      </div>
      <div
        data-testid="column"
        style={{ display: 'flex', flexDirection: 'column', blockSize: 1, inlineSize: 150 }}
      >
        <span style={{ flex: 'none', blockSize: 10 }} />
        <Divider data-testid="column-rule" />
        <Divider hidden label="Do not display" data-testid="hidden" />
      </div>
      <div
        data-testid="labels"
        style={{ inlineSize: 144, maxInlineSize: '100%', whiteSpace: 'nowrap' }}
      >
        <Divider label={phrase} labelPosition="start" data-testid="start" />
        <Divider label={phrase} data-testid="center" />
        <Divider label={phrase} labelPosition="end" data-testid="end" />
        <Divider label="organizationauthenticationmethod" data-testid="unbroken" />
        <Divider label={'  \t  '} labelPosition="end" data-testid="empty" />
      </div>
      <div data-surface="base">
        <BoundarySample name="outer-base" overlay={false} />
        <div data-surface="overlay">
          <BoundarySample name="outer-overlay" overlay />
          <Card>
            <BoundarySample name="card-on-overlay" overlay />
          </Card>
          <div data-theme="pixel-light">
            <BoundarySample name="themed-overlay" overlay />
          </div>
          <Divider label="Floating label" data-testid="overlay-label" />
          <div data-surface="base">
            <BoundarySample name="nested-base" overlay={false} />
            <div data-surface="overlay">
              <BoundarySample name="nested-overlay" overlay />
            </div>
          </div>
        </div>
      </div>
      <form data-testid="reading-flow">
        <span id="divider-name">Account sections</span>
        <button type="button">First stop</button>
        <Divider />
        <Divider orientation="vertical" />
        <Divider decorative={false} aria-labelledby="divider-name" aria-label="Fallback name" />
        <Divider label="or choose another method" style={{ inlineSize: 140 }} />
        <Divider orientation="vertical" decorative={false} aria-label="Action groups" />
        <button type="submit" name="submitter" value="next">
          Next stop
        </button>
      </form>
    </>
  );
}
