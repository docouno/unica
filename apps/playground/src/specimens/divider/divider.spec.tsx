import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { TextBIcon, TextItalicIcon, ListBulletsIcon, ListNumbersIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Divider } from '../../prototypes/divider/divider.proto.js';
import { Card } from '../../prototypes/card/card.proto.js';
import { IconButton } from '../../prototypes/button/button.proto.js';
import { PopoverContent } from '../../prototypes/popover/popover.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import '../../prototypes/divider/divider.examples.css';

function DividerSample({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <figure className="divider-demo-case">
      <figcaption className="divider-demo-case-title">{title}</figcaption>
      <div className="divider-demo-stage">{children}</div>
    </figure>
  );
}

function SurfaceSample(): ReactElement {
  return (
    <>
      <Text size="body-s" weight="medium">
        Document details
      </Text>
      <Divider />
      <div className="divider-demo-row">
        <Text size="caption-l" color="secondary">
          Draft
        </Text>
        <Divider orientation="vertical" />
        <Text size="caption-l" color="secondary">
          Saved just now
        </Text>
      </div>
      <Divider label="or use a template" />
      <Text size="body-s" color="secondary">
        Start with a reusable outline.
      </Text>
    </>
  );
}

function ToolbarExample(): ReactElement {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [list, setList] = useState<'bullets' | 'numbers' | null>(null);
  return (
    <div className="divider-demo-stack">
      <div className="divider-demo-toolbar" role="group" aria-label="Text formatting">
        <div className="divider-demo-toolbar-pair">
          <div className="divider-demo-toolbar-group" role="group" aria-label="Emphasis">
            <IconButton
              size="s"
              variant="ghost"
              icon={TextBIcon}
              aria-label="Bold"
              pressed={bold}
              onPressedChange={setBold}
            />
            <IconButton
              size="s"
              variant="ghost"
              icon={TextItalicIcon}
              aria-label="Italic"
              pressed={italic}
              onPressedChange={setItalic}
            />
          </div>
          <Divider orientation="vertical" decorative={false} />
          <div className="divider-demo-toolbar-group" role="group" aria-label="Lists">
            <IconButton
              size="s"
              variant="ghost"
              icon={ListBulletsIcon}
              aria-label="Bulleted list"
              pressed={list === 'bullets'}
              onPressedChange={(pressed) => setList(pressed ? 'bullets' : null)}
            />
            <IconButton
              size="s"
              variant="ghost"
              icon={ListNumbersIcon}
              aria-label="Numbered list"
              pressed={list === 'numbers'}
              onPressedChange={(pressed) => setList(pressed ? 'numbers' : null)}
            />
          </div>
        </div>
      </div>
      <Text size="caption-l" color="muted">
        Try Tab and the formatting toggles. The separator stays still and never receives focus.
      </Text>
    </div>
  );
}

export default defineComponent({
  id: 'divider',
  title: 'Divider',
  category: 'Surfaces & Structure',
  status: 'Proto',
  summary:
    'Quiet boundaries, short connecting labels, and clear groups. One pixel; spacing belongs to the layout.',
  componentName: 'Divider',
  props: {
    orientation: {
      kind: 'enum',
      group: 'Layout',
      default: 'horizontal',
      description: 'Axis of the separator.',
      choices: [{ value: 'horizontal' }, { value: 'vertical' }],
    },
    label: {
      kind: 'string',
      group: 'Content',
      default: '',
      description: 'Optional label for a horizontal separator.',
      examples: ['', 'Recent'],
    },
    labelPosition: {
      kind: 'enum',
      group: 'Content',
      default: 'center',
      description: 'Alignment of the horizontal label.',
      choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
    },
    decorative: {
      kind: 'boolean',
      group: 'Semantics',
      default: true,
      description: 'Hide an unlabeled separator from assistive technology.',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { orientation: 'vertical' },
      affects: ['label', 'labelPosition'],
      reason: 'Vertical separators have no label.',
    },
    {
      kind: 'ignored',
      when: { orientation: 'horizontal', label: '' },
      affects: ['labelPosition'],
      reason: 'Position applies when a label is present.',
    },
  ],
  render: ({ ctx, values }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        inlineSize: '100%',
        minBlockSize: '2.75rem',
      }}
    >
      <Divider {...ctx.subject} {...values} />
    </div>
  ),
  matrixViews: [
    {
      id: 'orientation',
      rows: 'orientation',
      cols: 'decorative',
      title: 'Horizontal & vertical',
      caption:
        'A full-width pause and a short upright boundary. No hover, pressed, loading, or disabled states.',
      reference: () => (
        <div className="divider-demo-stack">
          <div className="divider-demo-sample">
            <Text size="body-s" weight="medium">
              A little space to separate ideas
            </Text>
            <Divider />
            <Text size="body-s" color="secondary">
              The line supports the content hierarchy.
            </Text>
          </div>
          <div className="divider-demo-row">
            <Text size="body-s">Draft</Text>
            <Divider orientation="vertical" />
            <Text size="body-s" color="muted">
              Saved just now
            </Text>
          </div>
          <div className="divider-demo-columns">
            <div className="divider-demo-sample">
              <Text size="body-s" weight="medium">
                3 editors
              </Text>
              <Text size="caption-l" color="muted">
                Can make changes
              </Text>
            </div>
            <Divider orientation="vertical" />
            <div className="divider-demo-sample">
              <Text size="body-s" weight="medium">
                12 readers
              </Text>
              <Text size="caption-l" color="muted">
                Can view and comment
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'labels',
      rows: 'labelPosition',
      cols: 'label',
      title: 'Start, center & end',
      reference: () => (
        <div className="divider-demo-stack">
          <Text size="body-s" color="secondary">
            Start and end place the label against an edge. Center leaves a line on both sides.
          </Text>
          {(['start', 'center', 'end'] as const).map((position) => (
            <DividerSample
              key={position}
              title={`${position[0]?.toUpperCase()}${position.slice(1)}`}
            >
              <Divider label="or continue with email" labelPosition={position} />
            </DividerSample>
          ))}
          <DividerSample title="Short label · center">
            <Divider label="or" />
          </DividerSample>
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'wrapping',
      title: 'When the label wraps',
      kind: 'content',
      render: () => (
        <div className="divider-demo-stack">
          <Text size="body-s" color="secondary">
            The same three positions in a narrow space. Each shaded area contains one divider.
          </Text>
          <div className="divider-demo-comparisons">
            {(['start', 'center', 'end'] as const).map((position) => (
              <DividerSample
                key={position}
                title={`${position[0]?.toUpperCase()}${position.slice(1)}`}
              >
                <Divider
                  label="or continue with your organization’s email address"
                  labelPosition={position}
                />
              </DividerSample>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Unbroken & empty labels',
      kind: 'behavior',
      render: () => (
        <div className="divider-demo-stack">
          <Text size="body-s" color="secondary">
            Unbroken text wraps in full. An empty label becomes a single uninterrupted line.
          </Text>
          <div className="divider-demo-comparisons">
            <DividerSample title="Unbroken text · center">
              <Divider label="anotherworkspaceauthenticationmethod" />
            </DividerSample>
            <DividerSample title="Empty label">
              <Divider label="" />
            </DividerSample>
          </div>
        </div>
      ),
    },
    {
      id: 'surfaces',
      title: 'Canvas & card',
      caption:
        'The same rules on two real surfaces. Plain horizontal lines stay quieter than the card perimeter.',
      kind: 'surface',
      render: () => (
        <div className="divider-demo-grid">
          <div className="divider-demo-sample divider-demo-canvas">
            <SurfaceSample />
          </div>
          <Card>
            <SurfaceSample />
          </Card>
        </div>
      ),
    },
    {
      id: 'overlay',
      mode: 'pinned',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption: 'Static material preview over an underlay; the panel does not open or dismiss.',
      kind: 'surface',
      render: () => (
        <PopoverContent role="presentation" className="divider-demo-overlay">
          <SurfaceSample />
        </PopoverContent>
      ),
    },
  ],
  usage: [
    {
      id: 'context',
      code: `<div aria-label="Text formatting" role="toolbar">
  <IconButton aria-label="Bold" icon={TextBIcon} />
  <Divider orientation="vertical" />
  <IconButton aria-label="Bulleted list" icon={ListBulletsIcon} />
</div>`,
      title: 'Between action groups',
      caption:
        'The host gives a 30px action row a 4px top/bottom inset. Groups stay together when the layout narrows.',
      render: () => <ToolbarExample />,
    },
  ],
});
