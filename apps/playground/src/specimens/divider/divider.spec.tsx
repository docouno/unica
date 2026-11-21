import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { TextBIcon, TextItalicIcon, ListBulletsIcon, ListNumbersIcon } from '@phosphor-icons/react';
import { Divider } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewContext, PropSchema } from '../../workbench/types.js';
import { Card } from '../../prototypes/card/card.proto.js';
import { IconButton } from '../../prototypes/button/button.proto.js';
import { PopoverContent } from '../../prototypes/popover/popover.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import { previewProps } from '../preview-code.js';
import './divider.examples.css';

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

function SurfaceSample({ ctx }: { readonly ctx: PreviewContext }): ReactElement {
  return (
    <>
      <Text size="body-s" weight="medium">
        Document details
      </Text>
      <Divider {...ctx.subject} />
      <div className="divider-demo-row">
        <Text size="caption-l" color="secondary">
          Draft
        </Text>
        <Divider {...ctx.subject} orientation="vertical" />
        <Text size="caption-l" color="secondary">
          Saved just now
        </Text>
      </div>
      <Divider {...ctx.subject} label="or use a template" />
      <Text size="body-s" color="secondary">
        Start with a reusable outline.
      </Text>
    </>
  );
}

function ToolbarExample({ ctx }: { readonly ctx: PreviewContext }): ReactElement {
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
          <Divider
            {...ctx.subject}
            orientation="vertical"
            decorative={false}
            className="divider-demo-toolbar-rule"
          />
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

const dividerControls = {
  orientation: {
    kind: 'enum',
    group: 'Layout',
    default: 'horizontal',
    description: 'Axis of the separator.',
    choices: [{ value: 'horizontal' }, { value: 'vertical' }],
  },
  withLabel: {
    kind: 'boolean',
    group: 'Content',
    label: 'Show label',
    default: false,
    demo: true,
    description: 'Preview a horizontal divider with a connecting phrase.',
  },
  label: {
    kind: 'string',
    group: 'Content',
    default: 'or',
    description: 'A plain-text phrase. Empty or whitespace-only text gives a plain line.',
    examples: ['or', 'or continue with email'],
  },
  labelPosition: {
    kind: 'enum',
    group: 'Content',
    default: 'center',
    description: 'Alignment when the horizontal label contains text.',
    choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
  },
  decorative: {
    kind: 'boolean',
    group: 'Semantics',
    default: true,
    description: 'Hide an unlabeled separator from assistive technology.',
  },
  'aria-label': {
    kind: 'string',
    group: 'Semantics',
    default: '',
    description: 'Optional accessible name for a semantic plain divider.',
  },
} as const satisfies PropSchema;

function dividerProps(values: ComponentValues<typeof dividerControls>) {
  const { orientation, withLabel, label, labelPosition, decorative, 'aria-label': name } = values;
  if (withLabel && orientation === 'horizontal') {
    return label.trim() ? { label, labelPosition } : {};
  }
  return decorative
    ? { orientation }
    : { orientation, decorative: false as const, ...(name.trim() && { 'aria-label': name }) };
}

export default defineComponent({
  id: 'divider',
  title: 'Divider',
  category: 'Surfaces & Structure',
  status: 'UI',
  summary: 'A thin boundary between content or action groups, with an optional connecting phrase.',
  componentName: 'Divider',
  props: dividerControls,
  constraints: [
    {
      kind: 'forbidden',
      when: { withLabel: true },
      affects: [{ key: 'orientation', value: 'vertical' }],
      reason: 'Labels are horizontal.',
    },
    {
      kind: 'forbidden',
      when: { withLabel: true },
      affects: [{ key: 'decorative', value: false }],
      reason: 'A connecting phrase is read as text. Separator semantics apply to plain lines.',
    },
    {
      kind: 'ignored',
      when: { withLabel: false },
      affects: ['label', 'labelPosition'],
      reason: 'Turn on Show label to preview a phrase and its position.',
    },
    {
      kind: 'ignored',
      when: { decorative: true },
      affects: ['aria-label'],
      reason: 'Only a semantic plain divider can have an accessible name.',
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
      <Divider {...ctx.subject} {...dividerProps(values)} />
    </div>
  ),
  code: (values) =>
    `<Divider${previewProps(dividerProps(values), {
      orientation: 'horizontal',
      labelPosition: 'center',
    })} />`,
  matrixViews: [
    {
      id: 'orientation',
      rows: 'orientation',
      cols: 'decorative',
      title: 'Horizontal & vertical',
      caption:
        'A full-width pause and a short upright boundary. No hover, pressed, loading, or disabled states.',
      reference: ({ ctx }) => (
        <div className="divider-demo-stack">
          <div className="divider-demo-sample">
            <Text size="body-s" weight="medium">
              A little space to separate ideas
            </Text>
            <Divider {...ctx.subject} />
            <Text size="body-s" color="secondary">
              The line supports the content hierarchy.
            </Text>
          </div>
          <div className="divider-demo-row">
            <Text size="body-s">Draft</Text>
            <Divider {...ctx.subject} orientation="vertical" />
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
            <Divider {...ctx.subject} orientation="vertical" />
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
      fixed: { withLabel: true },
      title: 'Start, center & end',
      reference: ({ ctx }) => (
        <div className="divider-demo-stack">
          <Text size="body-s" color="secondary">
            Start and end place the label against an edge. Center leaves a line on both sides.
          </Text>
          {(['start', 'center', 'end'] as const).map((position) => (
            <DividerSample
              key={position}
              title={`${position[0]?.toUpperCase()}${position.slice(1)}`}
            >
              <Divider {...ctx.subject} label="or continue with email" labelPosition={position} />
            </DividerSample>
          ))}
          <DividerSample title="Short label · center">
            <Divider {...ctx.subject} label="or" />
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
      render: ({ ctx }) => (
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
                  {...ctx.subject}
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
      render: ({ ctx }) => (
        <div className="divider-demo-stack">
          <Text size="body-s" color="secondary">
            Unbroken text wraps in full. An empty label becomes a single uninterrupted line.
          </Text>
          <div className="divider-demo-comparisons">
            <DividerSample title="Unbroken text · center">
              <Divider {...ctx.subject} label="anotherworkspaceauthenticationmethod" />
            </DividerSample>
            <DividerSample title="Empty label">
              <Divider {...ctx.subject} label="" />
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
      render: ({ ctx }) => (
        <div className="divider-demo-grid">
          <div className="divider-demo-sample divider-demo-canvas">
            <SurfaceSample ctx={ctx} />
          </div>
          <Card>
            <SurfaceSample ctx={ctx} />
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
      render: ({ ctx }) => (
        <PopoverContent role="presentation" className="divider-demo-overlay">
          <SurfaceSample ctx={ctx} />
        </PopoverContent>
      ),
    },
  ],
  usage: [
    {
      id: 'context',
      code: `<div
  role="group"
  aria-label="Text formatting"
  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
>
  <div role="group" aria-label="Emphasis" style={{ display: 'flex', gap: 4 }}>
    <IconButton size="s" variant="ghost" aria-label="Bold" icon={TextBIcon} />
    <IconButton size="s" variant="ghost" aria-label="Italic" icon={TextItalicIcon} />
  </div>
  <Divider orientation="vertical" decorative={false} style={{ marginBlock: 4 }} />
  <div role="group" aria-label="Lists" style={{ display: 'flex', gap: 4 }}>
    <IconButton size="s" variant="ghost" aria-label="Bulleted list" icon={ListBulletsIcon} />
    <IconButton size="s" variant="ghost" aria-label="Numbered list" icon={ListNumbersIcon} />
  </div>
</div>`,
      title: 'Between action groups',
      caption:
        'The host gives a 30px action row a 4px top/bottom inset. Groups stay together when the layout narrows.',
      render: ToolbarExample,
    },
  ],
});
