import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { StarIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Checkbox } from '../../prototypes/binary-controls/binary-controls.proto.js';
import { Button, IconButton } from '../../prototypes/button/button.proto.js';
import { Card } from '../../prototypes/card/card.proto.js';
import { Code, CodeBlock } from '../../prototypes/code/code.proto.js';
import type { GlyphProps } from '../../prototypes/icon/icon.proto.js';
import {
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from '../../prototypes/popover/popover.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import { Title } from '../../prototypes/title/title.proto.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../prototypes/disclosure/disclosure.proto.js';
import '../../prototypes/disclosure/disclosure.examples.css';

function SizeStudy(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid" data-study="sizes">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="disclosure-study-sample" key={size}>
          <Text className="disclosure-study-label" size="caption-l" color="muted">
            {size.toUpperCase()}
          </Text>
          <Accordion headingLevel={3} size={size} defaultValue={['scope']}>
            <AccordionItem value="scope">
              <AccordionTrigger>Access scope</AccordionTrigger>
              <AccordionContent>Workspace members.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="history">
              <AccordionTrigger>Access history</AccordionTrigger>
              <AccordionContent>Activity from the last 30 days.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  );
}

function AccessGroup({
  exclusive = false,
  dividers = true,
}: {
  readonly exclusive?: boolean;
  readonly dividers?: boolean;
}): ReactElement {
  return (
    <Accordion headingLevel={3} defaultValue={['review']} exclusive={exclusive} dividers={dividers}>
      <AccordionItem value="review">
        <AccordionTrigger>Review permissions</AccordionTrigger>
        <AccordionContent>Editors can leave review comments.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="publish">
        <AccordionTrigger>Publish permissions</AccordionTrigger>
        <AccordionContent>Owners can publish revisions.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function OpeningModes(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid">
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Several sections
        </Text>
        <AccessGroup />
      </div>
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          One section at a time
        </Text>
        <AccessGroup exclusive />
      </div>
    </div>
  );
}

function TriggerStudy(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid">
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Keyboard focus
        </Text>
        <Accordion headingLevel={3}>
          <AccordionItem value="scope">
            <AccordionTrigger previewState="focus">Access scope</AccordionTrigger>
            <AccordionContent>Workspace members.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="history" disabled>
            <AccordionTrigger>Access history</AccordionTrigger>
            <AccordionContent>Activity from the last 30 days.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Unavailable item starts open
        </Text>
        <Accordion headingLevel={3} exclusive defaultValue={['scope']}>
          <AccordionItem value="scope" disabled>
            <AccordionTrigger>Access scope</AccordionTrigger>
            <AccordionContent>Workspace members.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="history">
            <AccordionTrigger>Access history</AccordionTrigger>
            <AccordionContent>Activity from the last 30 days.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

const previewUrl = 'https://preview.example.com/releases/2.4';

function ReleasePreview(): ReactElement {
  const [copyLabel, setCopyLabel] = useState('Copy link');

  useEffect(() => {
    if (copyLabel !== 'Copied') {
      return;
    }
    const reset = window.setTimeout(() => setCopyLabel('Copy link'), 2000);
    return () => window.clearTimeout(reset);
  }, [copyLabel]);

  async function copyLink(): Promise<void> {
    await navigator.clipboard.writeText(previewUrl);
    setCopyLabel('Copied');
  }

  return (
    <Card>
      <Title as="h2" size="heading-s">
        Release preview
      </Title>
      <Accordion headingLevel={3} size="s" defaultValue={['access']}>
        <AccordionItem value="link">
          <AccordionTrigger
            action={
              <Button
                variant="ghost"
                tone="neutral"
                size="s"
                className="disclosure-study-copy"
                onClick={() => {
                  copyLink().catch(() => setCopyLabel('Retry copy'));
                }}
              >
                <span aria-live="polite">{copyLabel}</span>
              </Button>
            }
          >
            Preview link
          </AccordionTrigger>
          <AccordionContent>
            <div className="disclosure-study-link">
              <span>
                <Code plate={false}>{previewUrl}</Code>
              </span>
              <span>
                <bdi>Available until Friday at 18:00 UTC.</bdi>
              </span>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="access">
          <AccordionTrigger>Who can open it</AccordionTrigger>
          <AccordionContent>
            <span dir="auto">Anyone with the link can view this preview.</span>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function OnOverlay(): ReactElement {
  return (
    <PopoverContent role="presentation" className="disclosure-study-overlay">
      <PopoverHeader>
        <PopoverTitle as="h2">Workspace access</PopoverTitle>
      </PopoverHeader>
      <PopoverBody>
        <AccessGroup />
      </PopoverBody>
    </PopoverContent>
  );
}

const changedFiles = [
  {
    name: 'pricing.ts',
    diff: '- return net + tax;\n+ return round(net + tax);',
  },
  {
    name: 'pricing.test.ts',
    diff: '- expect(total).toBe(218.9);\n+ expect(total).toBe(219);',
  },
] as const;

function FileReview(): ReactElement {
  const [expanded, setExpanded] = useState<readonly string[]>(['pricing.ts']);
  const [reviewed, setReviewed] = useState<readonly string[]>(['pricing.test.ts']);

  function reviewFile(name: string, checked: boolean): void {
    setReviewed((current) =>
      checked ? [...current, name] : current.filter((file) => file !== name),
    );
    if (checked) {
      setExpanded((current) => current.filter((file) => file !== name));
    }
  }

  return (
    <Card>
      <div className="disclosure-study-summary">
        <Title as="h2" size="heading-s">
          Changed files
        </Title>
        <Text size="caption-l" color="muted" role="status" dir="auto">
          {reviewed.length} of {changedFiles.length} reviewed
        </Text>
      </div>
      <Accordion headingLevel={3} size="s" value={expanded} onValueChange={setExpanded}>
        {changedFiles.map(({ name, diff }) => (
          <AccordionItem value={name} key={name}>
            <AccordionTrigger
              action={
                <Checkbox
                  size="s"
                  label="Reviewed"
                  aria-label={`Reviewed ${name}`}
                  checked={reviewed.includes(name)}
                  onCheckedChange={(checked) => reviewFile(name, checked)}
                />
              }
            >
              <Code plate={false}>{name}</Code>
            </AccordionTrigger>
            <AccordionContent>
              <CodeBlock aria-label={`Changes to ${name}`}>{diff}</CodeBlock>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}

const queries = [
  { name: 'Open incidents', description: 'Unresolved incidents from the last 24 hours.' },
  { name: 'Slow requests', description: 'Requests taking longer than 500 ms in the last hour.' },
] as const;

function FilledStarIcon(props: GlyphProps): ReactElement {
  return <StarIcon {...props} weight="fill" />;
}

function QueryLibrary(): ReactElement {
  const [favorites, setFavorites] = useState<readonly string[]>(['Slow requests']);

  return (
    <Card>
      <Title as="h2" size="heading-s">
        Query library
      </Title>
      <Accordion headingLevel={3} size="s" defaultValue={['Slow requests']}>
        {queries.map(({ name, description }) => {
          const favorite = favorites.includes(name);
          return (
            <AccordionItem value={name} key={name}>
              <AccordionTrigger
                action={
                  <IconButton
                    size="s"
                    variant="ghost"
                    tone="neutral"
                    icon={favorite ? FilledStarIcon : StarIcon}
                    aria-label={`Favorite ${name}`}
                    title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                    pressed={favorite}
                    onPressedChange={(pressed) =>
                      setFavorites((current) =>
                        pressed ? [...current, name] : current.filter((query) => query !== name),
                      )
                    }
                  />
                }
              >
                {name}
              </AccordionTrigger>
              <AccordionContent>
                <span dir="auto">{description}</span>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Card>
  );
}

function HeaderActions(): ReactElement {
  return (
    <div className="disclosure-study-actions">
      <ReleasePreview />
      <FileReview />
      <QueryLibrary />
    </div>
  );
}

export default defineComponent({
  id: 'accordion',
  title: 'Accordion',
  category: 'Surfaces & Structure',
  status: 'Proto',
  summary: 'Group related section headings and reveal their contents in place.',
  props: {
    size: {
      kind: 'enum',
      group: 'Layout',
      default: 'm',
      description: 'Trigger and panel density.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    exclusive: {
      kind: 'boolean',
      group: 'Behavior',
      default: false,
      description: 'Keep at most one item expanded.',
    },
    dividers: {
      kind: 'boolean',
      group: 'Layout',
      default: true,
      description: 'Draw separators between adjacent items.',
    },
    onValueChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports expanded item values.',
      code: 'handleValueChange',
    },
  },
  code: (
    values,
  ) => `<Accordion headingLevel={3}${values.size === 'm' ? '' : ` size="${values.size}"`}${values.exclusive ? ' exclusive' : ''}${values.dividers ? '' : ' dividers={false}'} onValueChange={handleValueChange}>
  <AccordionItem value="access">
    <AccordionTrigger>Project access</AccordionTrigger>
    <AccordionContent>Workspace members can read the project.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="history">
    <AccordionTrigger>Activity history</AccordionTrigger>
    <AccordionContent>See changes from the last 30 days.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  render: ({ values, ctx }) => (
    <Accordion
      {...ctx.subject}
      headingLevel={3}
      size={values.size}
      exclusive={values.exclusive}
      dividers={values.dividers}
      onValueChange={ctx.action('onValueChange')}
    >
      <AccordionItem value="access">
        <AccordionTrigger>Project access</AccordionTrigger>
        <AccordionContent>Workspace members can read the project.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="history">
        <AccordionTrigger>Activity history</AccordionTrigger>
        <AccordionContent>See changes from the last 30 days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  matrixViews: [
    {
      id: 'sizes',
      title: 'Group sizes',
      rows: 'size',
      reference: () => <SizeStudy />,
    },
    {
      id: 'modes',
      title: 'Opening modes',
      rows: 'exclusive',
      caption: 'Both groups can close completely. The first also lets you compare open sections.',
      reference: () => <OpeningModes />,
    },
    {
      id: 'dividers',
      title: 'Without dividers',
      rows: 'dividers',
      reference: () => (
        <div className="disclosure-study-narrow">
          <AccessGroup dividers={false} />
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Focus and availability',
      caption:
        'The focus ring is pinned in the first group. Opening Access history in the exclusive group closes the unavailable item.',
      kind: 'behavior',
      render: () => <TriggerStudy />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'The host panel is a static material preview. The disclosure rows inside it are live.',
      kind: 'surface',
      render: () => <OnOverlay />,
    },
  ],
  usage: [
    {
      id: 'actions',
      title: 'Independent header actions',
      code: `<Accordion headingLevel={3} size="s" defaultValue={['Slow requests']}>
  <AccordionItem value="Slow requests">
    <AccordionTrigger action={
      <IconButton icon={StarIcon} aria-label="Favorite Slow requests" pressed={favorite}
        onPressedChange={setFavorite} />
    }>
      Slow requests
    </AccordionTrigger>
    <AccordionContent>{description}</AccordionContent>
  </AccordionItem>
</Accordion>`,
      render: () => <HeaderActions />,
    },
  ],
});
