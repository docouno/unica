import { useEffect, useState } from 'react';
import { StarIcon } from '@phosphor-icons/react';
import {
  Button,
  Card,
  Checkbox,
  Code,
  Flex,
  IconButton,
  Stack,
  Text,
  Title,
  defineGlyph,
} from '@docouno/unica';
import { CodeBlock } from '../../prototypes/code-block/code-block.proto.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../prototypes/disclosure/disclosure.proto.js';

const previewUrl = 'https://preview.example.com/releases/2.4';

function ReleasePreview() {
  const [copyLabel, setCopyLabel] = useState('Copy link');

  useEffect(() => {
    if (copyLabel === 'Copied') {
      const timer = window.setTimeout(() => setCopyLabel('Copy link'), 2000);
      return () => window.clearTimeout(timer);
    }
  }, [copyLabel]);

  function copyLink() {
    if (!navigator.clipboard) {
      setCopyLabel('Retry copy');
      return;
    }
    navigator.clipboard.writeText(previewUrl).then(
      () => setCopyLabel('Copied'),
      () => setCopyLabel('Retry copy'),
    );
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
                size="s"
                variant="ghost"
                tone="neutral"
                style={{ minInlineSize: '8.25em' }}
                onClick={copyLink}
              >
                <span aria-live="polite">{copyLabel}</span>
              </Button>
            }
          >
            Preview link
          </AccordionTrigger>
          <AccordionContent>
            <Stack gap={4}>
              <Code plate={false}>{previewUrl}</Code>
              <bdi>Available until Friday at 18:00 UTC.</bdi>
            </Stack>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="access">
          <AccordionTrigger>Who can open it</AccordionTrigger>
          <AccordionContent>
            <bdi>Anyone with the link can view this preview.</bdi>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

const changedFiles = [
  { name: 'pricing.ts', diff: '- return net + tax;\n+ return round(net + tax);' },
  { name: 'pricing.test.ts', diff: '- expect(total).toBe(218.9);\n+ expect(total).toBe(219);' },
];

function FileReview() {
  const [expanded, setExpanded] = useState(['pricing.ts']);
  const [reviewed, setReviewed] = useState(['pricing.test.ts']);

  return (
    <Card>
      <Flex
        wrap="wrap"
        align="baseline"
        justify="space-between"
        gap={12}
        style={{ rowGap: 'var(--space-4)' }}
      >
        <Title as="h2" size="heading-s">
          Changed files
        </Title>
        <Text size="caption-l" color="muted" role="status">
          <bdi>
            {reviewed.length} of {changedFiles.length} reviewed
          </bdi>
        </Text>
      </Flex>
      <Accordion
        headingLevel={3}
        size="s"
        value={expanded}
        onValueChange={(next) => setExpanded([...next])}
      >
        {changedFiles.map(({ name, diff }) => (
          <AccordionItem key={name} value={name}>
            <AccordionTrigger
              action={
                <Checkbox
                  size="s"
                  label="Reviewed"
                  aria-label={`Reviewed ${name}`}
                  checked={reviewed.includes(name)}
                  onCheckedChange={(checked) => {
                    setReviewed((files) =>
                      checked ? [...files, name] : files.filter((file) => file !== name),
                    );
                    if (checked) {
                      setExpanded((files) => files.filter((file) => file !== name));
                    }
                  }}
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
];
const filledStar = defineGlyph((props) => <StarIcon {...props} weight="fill" />);

function QueryLibrary() {
  const [favorites, setFavorites] = useState(['Slow requests']);

  return (
    <Card>
      <Title as="h2" size="heading-s">
        Query library
      </Title>
      <Accordion headingLevel={3} size="s" defaultValue={['Slow requests']}>
        {queries.map(({ name, description }) => {
          const favorite = favorites.includes(name);
          return (
            <AccordionItem key={name} value={name}>
              <AccordionTrigger
                action={
                  <IconButton
                    size="s"
                    variant="ghost"
                    tone="neutral"
                    icon={favorite ? filledStar : StarIcon}
                    aria-label={`Favorite ${name}`}
                    title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                    pressed={favorite}
                    onPressedChange={(pressed) =>
                      setFavorites((names) =>
                        pressed ? [...names, name] : names.filter((entry) => entry !== name),
                      )
                    }
                  />
                }
              >
                {name}
              </AccordionTrigger>
              <AccordionContent>
                <bdi>{description}</bdi>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Card>
  );
}

export function HeaderActions() {
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 27rem)' }}>
      <ReleasePreview />
      <FileReview />
      <QueryLibrary />
    </Stack>
  );
}
