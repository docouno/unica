import { useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Button, Card, FormField, Input, Stack, TagGroup, Text } from '@docouno/unica';
import type { ControlSize } from '@docouno/unica';
import { TagsInput } from '../../prototypes/tags-input/tags-input.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import './tags-input.examples.css';

function Example({
  title,
  children,
  inert,
}: {
  readonly inert?: boolean;
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack gap={16} inert={inert} style={{ minInlineSize: 0 }}>
      <Text size="caption-l" color="secondary">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </Stack>
  );
}

export function TagsRoles({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="tags-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example
          key={variant}
          title={variant === 'default' ? 'Default · form field' : 'Ghost · inline property'}
        >
          <Stack gap={16}>
            {(['s', 'm', 'l'] as const).map((size) => (
              <TagsInput
                {...ctx.subject}
                key={size}
                label={`${size.toUpperCase()} · Topics`}
                variant={variant}
                size={size}
                initialValues={['Research']}
              />
            ))}
            <TagsInput
              {...ctx.subject}
              label="Empty"
              variant={variant}
              placeholder="Add a topic"
              description="Enter or Add to confirm. Spaces and commas belong to the tag."
            />
          </Stack>
        </Example>
      ))}
    </div>
  );
}

function ShapeComparison({
  size,
  ctx,
}: PreviewProps & { readonly size: ControlSize }): ReactElement {
  const [values, setValues] = useState<readonly string[]>(['Research', 'Field notes']);
  const editor = useRef<HTMLTextAreaElement>(null);
  return (
    <Example title={`${size.toUpperCase()} · same values in two contexts`}>
      <Text size="caption-l" color="secondary">
        Outside the field
      </Text>
      <TagGroup
        size={size}
        items={values.map((value) => ({ id: value, label: value, removeLabel: `Remove ${value}` }))}
        aria-label={`Standalone subjects ${size}`}
        onRemove={(value) => setValues((current) => current.filter((item) => item !== value))}
        emptyFocusRef={editor}
        messages={{ empty: 'No subjects' }}
      />
      <TagsInput
        {...ctx.subject}
        ref={editor}
        size={size}
        label="Inside the field"
        values={values}
        onValuesChange={setValues}
        placeholder="Add a subject"
      />
    </Example>
  );
}

export function TagsShape({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="tags-examples-proto">
      {(['s', 'm', 'l'] as const).map((size) => (
        <ShapeComparison key={size} size={size} ctx={ctx} />
      ))}
    </div>
  );
}

export function TagsAnatomy({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <div className="tags-examples-proto">
      <Example title="One shared field">
        <TagsInput
          {...ctx.subject}
          label="Topics"
          initialValues={['Research', 'Field notes', 'Paris, Texas']}
          initialDraft="Oral history"
          description="Accepted tags → draft → Add. The draft and action wrap together."
        />
      </Example>
      <Example title="No selected options or menu">
        <TagsInput
          {...ctx.subject}
          label="Allowed domains"
          initialValues={['example.org', 'archive.example']}
          placeholder="Add a domain"
          description="A free-form set of strings. Use Combobox for suggestions or a catalog."
        />
      </Example>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Example title={`${size.toUpperCase()} · shared control rhythm`} key={size} inert>
          <Stack gap={16}>
            <FormField controlId={`${id}-title-${size}`} label="Collection title" size={size}>
              <Input id={`${id}-title-${size}`} size={size} defaultValue="Field notes" />
            </FormField>
            <TagsInput {...ctx.subject} size={size} label="Topics" initialValues={['Research']} />
            <Button size={size} variant="secondary" tone="neutral">
              Save collection
            </Button>
          </Stack>
        </Example>
      ))}
    </div>
  );
}

export function TagsInteraction({ ctx }: PreviewProps): ReactElement {
  const comparisons = [
    ['Rest · empty draft', undefined, ''],
    ['Field hover', 'hover', ''],
    ['Pointer editing', 'pointer-focus', 'Field notes'],
    ['Editor · keyboard focus', 'keyboard-focus', 'Field notes'],
    ['Add · hover', 'add-hover', 'Field notes'],
    ['Add · press', 'add-active', 'Field notes'],
    ['Add · keyboard focus', 'add-focus', 'Field notes'],
  ] as const;
  return (
    <div className="tags-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example title={variant === 'default' ? 'Default' : 'Ghost'} key={variant} inert>
          <Stack gap={16}>
            {comparisons.map(([label, previewState, initialDraft]) => (
              <TagsInput
                {...ctx.subject}
                key={label}
                label={label}
                variant={variant}
                initialValues={['Research']}
                initialDraft={initialDraft}
                previewState={previewState}
              />
            ))}
          </Stack>
        </Example>
      ))}
      <Example title="Live keyboard & pointer">
        <TagsInput
          {...ctx.subject}
          label="Try it"
          initialValues={['Research', 'Interviews']}
          description="Tab into the editor. At its start, use the backward arrow. On an empty draft, Backspace focuses the last ×. A second press removes it. Escape returns to editing."
        />
      </Example>
    </div>
  );
}

export function TagsFeedback({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      <div className="tags-examples-proto" inert>
        <TagsInput
          {...ctx.subject}
          label="Info · visibility"
          status="info"
          initialValues={['Research']}
          message="Topics are visible to everyone with collection access."
        />
        <TagsInput
          {...ctx.subject}
          label="Success · checked values"
          status="success"
          initialValues={['example.org']}
          message="All domains are verified."
        />
        <TagsInput
          {...ctx.subject}
          label="Warning · review before sharing"
          status="warning"
          initialValues={['External reviewers']}
          message="Some recipients are outside your organization."
        />
        <TagsInput
          {...ctx.subject}
          label="Danger · field validation"
          status="danger"
          initialValues={['example.org']}
          message="Add at least two domains before continuing."
        />
        <TagsInput
          {...ctx.subject}
          label="Required · empty after checking"
          required
          status="danger"
          message="Add at least one topic."
        />
      </div>
      <div className="tags-examples-proto">
        <TagsInput
          {...ctx.subject}
          label="Ghost · invalid draft"
          variant="ghost"
          initialDraft="example"
          initialError="Nothing added. Line 1: Enter a complete domain."
          validate={(value) =>
            /^[^\s.]+(?:\.[^\s.]+)+$/.test(value) ? undefined : 'Enter a complete domain.'
          }
        />
        <TagsInput
          {...ctx.subject}
          label="Duplicate · retained draft"
          initialValues={['Research']}
          initialDraft="Research"
          initialError="Nothing added. Line 1: “Research” is already included."
        />
      </div>
    </Stack>
  );
}

function validateEmail(value: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Enter a complete email address.';
}

export function TagsBatches({ ctx }: PreviewProps): ReactElement {
  const action = ctx.story?.lastAction;
  const rejected = action?.id !== 'valid';
  return (
    <div className="tags-examples-proto">
      <Example title="Repair a batch · live local validation">
        <TagsInput
          {...ctx.subject}
          key={action?.seq ?? 0}
          label="Recipients"
          initialValues={['team@example.org']}
          initialDraft={
            rejected
              ? 'editor@example.org\nmissing-domain\nreviewer@example.org'
              : 'editor@example.org\nreviewer@example.org'
          }
          initialError={rejected ? 'Nothing added. Line 2: Enter a complete email address.' : ''}
          validate={validateEmail}
          maxTags={8}
          description="Use one complete address per line. Correct any rejected line, then add the batch."
        />
      </Example>
      <Example title="Free text · punctuation is content">
        <TagsInput
          {...ctx.subject}
          label="Places"
          initialValues={['Paris, Texas', 'New York']}
          initialDraft="Portland, Maine"
          description="Commas and spaces do not split a tag. Paste one tag per line to add a batch."
        />
      </Example>
      <Example title="Rejected batch · capacity">
        <TagsInput
          {...ctx.subject}
          label="Topics"
          initialValues={['Research']}
          initialDraft={'History\nPhotography\nInterviews'}
          maxTags={3}
          initialError="Nothing added. This batch exceeds the 3-tag limit. 2 places available."
        />
      </Example>
      <Example title="Four visible lines · native scroll beyond">
        <TagsInput
          {...ctx.subject}
          label="Recipients"
          initialDraft={
            'one@example.org\ntwo@example.org\nincomplete\nthree@example.org\nfour@example.org\nfive@example.org'
          }
          validate={validateEmail}
          initialError="Nothing added. Line 3: Enter a complete email address."
          description="The text scrolls down to the field edge. Add has its own space beside it. Shift+Enter inserts a line."
        />
      </Example>
    </div>
  );
}

export function TagsAvailability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="tags-examples-proto">
      <Example title="Limit reached · remove to free a place">
        <TagsInput
          {...ctx.subject}
          label="Topics"
          initialValues={['Research', 'History', 'Photography']}
          maxTags={3}
          description="The field stays readable. Removal and draft editing remain available."
        />
      </Example>
      <Example title="Limit reached · keep a draft">
        <TagsInput
          {...ctx.subject}
          label="Topics"
          initialValues={['Research', 'History']}
          initialDraft="Interviews"
          maxTags={2}
          description="Remove either tag. Add becomes available without retyping the draft."
        />
      </Example>
      <Example title="Read only · all values, no actions">
        <TagsInput
          {...ctx.subject}
          label="Allowed domains"
          initialValues={[
            'research.example.org',
            'digital-collections.example.org',
            'archive.example.org',
          ]}
          readOnly
          description="Managed by your organization. Full values can be selected and copied."
        />
      </Example>
      <Example title="Read only · preserved unadded text">
        <TagsInput
          {...ctx.subject}
          label="Topics"
          initialValues={['Research', 'Field notes']}
          initialDraft={'Oral history\nUnreviewed material'}
          readOnly
          description="The draft is retained separately and is not part of the accepted values."
        />
      </Example>
      <Example title="Disabled · populated">
        <TagsInput
          {...ctx.subject}
          label="Topics"
          initialValues={['Research', 'Field notes']}
          disabled
          description="Editing is unavailable while the collection is being transferred."
        />
      </Example>
      <Example title="Disabled · empty Ghost">
        <TagsInput
          {...ctx.subject}
          label="Topics"
          variant="ghost"
          disabled
          description="Choose a collection before adding topics."
        />
      </Example>
      <Example title="Live transition · editing ↔ reading">
        <TagsInput
          {...ctx.subject}
          label="Subjects"
          initialValues={['Oral history', 'Paris, Texas']}
          initialDraft="Not yet added"
          readOnly={ctx.story?.controls.readOnly === true}
          description={
            ctx.story?.controls.readOnly
              ? 'Select and copy the complete accepted values.'
              : 'The draft stays separate from the accepted values.'
          }
        />
      </Example>
    </div>
  );
}

export function TagsOverflow({ ctx }: PreviewProps): ReactElement {
  const address = 'digital-collections-and-research-coordination@example.org';
  return (
    <div className="tags-examples-proto">
      <Example title="Long values · readable in place">
        <TagsInput
          {...ctx.subject}
          label="Recipients"
          initialValues={[address, 'editor@example.org']}
          description="Complete values wrap inside their tags. Hover and focus keep the layout still."
        />
      </Example>
      <Example title="Long identifier · no hidden text">
        <TagsInput
          {...ctx.subject}
          label="Subjects"
          initialValues={[
            'Digital preservation and access to community photography collections',
            'archive_2026_11_research_materials_collection_preservation_master',
          ]}
          description="Select the text to copy it. Only the separate × removes a value."
        />
      </Example>
      <Example title="Many values · wrap, never hide">
        <TagsInput
          {...ctx.subject}
          label="Subjects"
          initialValues={[
            'Research',
            'Oral history',
            'Photography',
            'Architecture',
            'Field notes',
            'Exhibitions',
            'Public archives',
            'Typography',
          ]}
          initialDraft="New material"
        />
      </Example>
      <Example title="Long draft · no content loss">
        <TagsInput
          {...ctx.subject}
          label="Subject"
          initialDraft="A descriptive subject with enough detail to wrap naturally within a narrow field without turning into a tiny horizontal viewport"
          description="The first wrap opens the editor across the field, with dedicated space beside the text for Add."
        />
      </Example>
      <Example title="Bounded draft · full-width scroll">
        <TagsInput
          {...ctx.subject}
          label="Recipients"
          initialValues={['team@example.org']}
          initialDraft={
            'one@example.org\ntwo@example.org\nthree@example.org\nfour@example.org\nfive@example.org\nsix@example.org\nseven@example.org'
          }
          description="Four visible lines, then native scroll. The text reaches the field edge and keeps clear of Add."
        />
      </Example>
      <Example title="Disabled · complete values stay visible">
        <TagsInput
          {...ctx.subject}
          label="Recipients"
          initialValues={[address, 'editor@example.org']}
          disabled
          description="Editing is temporarily unavailable. Values remain readable and selectable."
        />
      </Example>
      <Example title="Mixed reading directions">
        <TagsInput
          {...ctx.subject}
          label="Research languages and places"
          className="tags-mixed-script-study"
          initialValues={['Paris, Texas', 'العمارة', 'עברית', '東京']}
          description="Each accepted string keeps its own reading direction as the field mirrors."
        />
      </Example>
      <Example title="Long label and help">
        <TagsInput
          {...ctx.subject}
          label="Subjects used to organize the collection and its public discovery page"
          initialValues={['Digital preservation']}
          description="Use specific, meaningful phrases. The label, help, feedback, and complete values all wrap at narrow widths and with larger text."
        />
      </Example>
    </div>
  );
}

export function TagsDrafts({ ctx }: PreviewProps): ReactElement {
  const draft =
    'one@example.org\ntwo@example.org\nthree@example.org\nfour@example.org\nfive@example.org\nsix@example.org\nseven@example.org';
  return (
    <div className="tags-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example
          key={variant}
          title={`${variant === 'default' ? 'Default' : 'Ghost'} · full-width draft`}
        >
          <Stack gap={16}>
            <TagsInput
              {...ctx.subject}
              label="Short draft · no scrollbar"
              variant={variant}
              initialValues={['team@example.org']}
              initialDraft="one@example.org"
            />
            <TagsInput
              {...ctx.subject}
              label="Two lines · no scrollbar"
              variant={variant}
              initialValues={['team@example.org']}
              initialDraft={'one@example.org\ntwo@example.org'}
            />
            {(['s', 'm', 'l'] as const).map((size) => (
              <TagsInput
                {...ctx.subject}
                key={size}
                size={size}
                variant={variant}
                label={`${size.toUpperCase()} · Recipients`}
                initialValues={['team@example.org']}
                initialDraft={draft}
                description="Text scrolls to the field edge. Add keeps its own space."
              />
            ))}
          </Stack>
        </Example>
      ))}
    </div>
  );
}

export function TagsSurfaces({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <div className="tags-examples-proto">
      {(['base', 'overlay'] as const).map((surface) => {
        const fields = (
          <Example title={surface === 'base' ? 'Base · a form slot' : 'Overlay · the same field'}>
            <FormField controlId={`${id}-${surface}`} label="Collection">
              <Input id={`${id}-${surface}`} defaultValue="Field notes" />
            </FormField>
            <TagsInput
              {...ctx.subject}
              label="Topics"
              initialValues={['Research', 'Oral history']}
              placeholder="Add a topic"
            />
            <TagsInput
              {...ctx.subject}
              variant="ghost"
              label="Inline topics"
              initialValues={['Archive']}
              placeholder="Add a topic"
            />
          </Example>
        );
        return surface === 'base' ? (
          <Card key={surface} variant="subtle" size="s" data-surface="base">
            {fields}
          </Card>
        ) : (
          <ExampleSurface key={surface} surface={surface} sizing="border-box">
            {fields}
          </ExampleSurface>
        );
      })}
    </div>
  );
}

export function TagsSubmission({ ctx }: PreviewProps): ReactElement {
  const [values, setValues] = useState<readonly string[]>(['Research']);
  const [receipt, setReceipt] = useState('');
  return (
    <div className="tags-examples-proto">
      <Example title="Draft protection · local native form">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const topics = new FormData(event.currentTarget)
              .getAll('topic')
              .filter((value) => typeof value === 'string');
            setReceipt(
              topics.length
                ? `Submitted topics: ${topics.join(', ')}`
                : 'Submitted without topics.',
            );
          }}
        >
          <Stack gap={16}>
            <TagsInput
              {...ctx.subject}
              label="Topics"
              values={values}
              initialDraft="Unadded topic"
              onValuesChange={(next) => {
                setValues(next);
                setReceipt('');
              }}
              onDraftChange={() => setReceipt('')}
              description="Add or clear the draft before continuing. Leaving the field preserves the draft."
            />
            {values.map((value) => (
              <input key={value} type="hidden" name="topic" value={value} />
            ))}
            <div>
              <Button type="submit" variant="secondary" tone="neutral">
                Continue
              </Button>
            </div>
            <Text size="body-s" color="secondary" role="status">
              <bdi>{receipt}</bdi>
            </Text>
          </Stack>
        </form>
      </Example>
      <Example title="Ghost · a compact property">
        <TagsInput
          {...ctx.subject}
          label="Topics"
          variant="ghost"
          initialValues={['Research', 'Field notes']}
          description="Add accepts the draft. Moving focus away leaves it available for editing."
        />
      </Example>
    </div>
  );
}
