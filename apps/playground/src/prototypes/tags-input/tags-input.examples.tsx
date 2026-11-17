import { useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { ControlSize } from '../input/input.proto.js';
import { Button } from '../button/button.proto.js';
import { Input } from '../input/input.proto.js';
import { TagGroup } from '../tag/tag.proto.js';
import { TagsInput } from './tags-input.proto.js';
import './tags-input.examples.css';

function Example({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="tags-example-proto">
      <div className="tags-example-title-proto">{title}</div>
      {children}
    </div>
  );
}

export function TagsRoles(): ReactElement {
  return (
    <div className="tags-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example
          key={variant}
          title={variant === 'default' ? 'Default · form field' : 'Ghost · inline property'}
        >
          <div className="tags-demo-stack-proto">
            {(['s', 'm', 'l'] as const).map((size) => (
              <TagsInput
                key={size}
                label={`${size.toUpperCase()} · Topics`}
                variant={variant}
                size={size}
                initialValues={['Research']}
              />
            ))}
            <TagsInput
              label="Empty"
              variant={variant}
              placeholder="Add a topic…"
              description="Enter or Add to confirm. Spaces and commas belong to the tag."
            />
          </div>
        </Example>
      ))}
    </div>
  );
}

function ShapeComparison({ size }: { readonly size: ControlSize }): ReactElement {
  const [values, setValues] = useState<readonly string[]>(['Research', 'Field notes']);
  const editor = useRef<HTMLTextAreaElement>(null);
  return (
    <Example title={`${size.toUpperCase()} · same values in two contexts`}>
      <div className="tags-example-title-proto">Outside the field</div>
      <TagGroup
        size={size}
        items={values.map((value) => ({ id: value, label: value, removeLabel: `Remove ${value}` }))}
        label={`Standalone subjects ${size}`}
        onRemove={(value) => setValues(values.filter((item) => item !== value))}
        emptyFocusRef={editor}
        emptyMessage="No subjects"
      />
      <TagsInput
        ref={editor}
        size={size}
        label="Inside the field"
        values={values}
        onValuesChange={setValues}
        placeholder="Add a subject…"
        description="The two views share their values. Add or remove in either view."
      />
    </Example>
  );
}

export function TagsShape(): ReactElement {
  return (
    <div className="tags-examples-proto">
      {(['s', 'm', 'l'] as const).map((size) => (
        <ShapeComparison key={size} size={size} />
      ))}
    </div>
  );
}

export function TagsAnatomy(): ReactElement {
  return (
    <div className="tags-examples-proto">
      <Example title="One shared field">
        <TagsInput
          label="Topics"
          initialValues={['Research', 'Field notes', 'Paris, Texas']}
          initialDraft="Oral history"
          description="Accepted tags → draft → Add. The draft and action wrap together."
        />
      </Example>
      <Example title="No selected options or menu">
        <TagsInput
          label="Allowed domains"
          initialValues={['example.org', 'archive.example']}
          placeholder="Add a domain…"
          description="A free-form set of strings. Use Combobox for suggestions or a catalog."
        />
      </Example>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Example title={`${size.toUpperCase()} · shared control rhythm`} key={size}>
          <div className="tags-demo-stack-proto">
            <Input size={size} label="Collection title" defaultValue="Field notes" />
            <TagsInput size={size} label="Topics" initialValues={['Research']} />
            <Button size={size} variant="secondary" tone="neutral">
              Save collection
            </Button>
          </div>
        </Example>
      ))}
    </div>
  );
}

export function TagsInteraction(): ReactElement {
  const comparisons = [
    ['Rest · empty draft', undefined, ''],
    ['Field hover', 'hover', ''],
    ['Pointer editing', 'pointer-focus', 'Field notes'],
    ['Editor · keyboard focus', 'keyboard-focus', 'Field notes'],
    ['Tag · first Backspace', 'tag-focus', ''],
    ['Add · hover', 'add-hover', 'Field notes'],
    ['Add · press', 'add-active', 'Field notes'],
    ['Add · keyboard focus', 'add-focus', 'Field notes'],
  ] as const;
  return (
    <div className="tags-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example title={variant === 'default' ? 'Default' : 'Ghost'} key={variant}>
          <div className="tags-demo-stack-proto">
            {comparisons.map(([label, previewState, initialDraft]) => (
              <TagsInput
                key={label}
                label={label}
                variant={variant}
                initialValues={['Research']}
                initialDraft={initialDraft}
                previewState={previewState}
              />
            ))}
          </div>
        </Example>
      ))}
      <Example title="Live keyboard & pointer">
        <TagsInput
          label="Try it"
          initialValues={['Research', 'Interviews']}
          description="Tab into the editor. At its start, use the backward arrow; on an empty draft, Backspace focuses the last ×. A second press removes it. Escape returns to editing."
        />
      </Example>
    </div>
  );
}

export function TagsFeedback(): ReactElement {
  return (
    <div className="tags-examples-proto">
      <TagsInput
        label="Info · visibility"
        status="info"
        initialValues={['Research']}
        message="Topics are visible to everyone with collection access."
      />
      <TagsInput
        label="Success · checked values"
        status="success"
        initialValues={['example.org']}
        message="All domains are verified."
      />
      <TagsInput
        label="Warning · review before sharing"
        status="warning"
        initialValues={['External reviewers']}
        message="Some recipients are outside your organization."
      />
      <TagsInput
        label="Danger · field validation"
        status="danger"
        initialValues={['example.org']}
        message="Add at least two domains before continuing."
      />
      <TagsInput
        label="Required · empty after checking"
        required
        status="danger"
        message="Add at least one topic."
      />
      <TagsInput
        label="Ghost · invalid draft"
        variant="ghost"
        initialDraft="example"
        initialError="Nothing added. Line 1: Enter a complete domain."
        validate={(value) =>
          /^[^\s.]+(?:\.[^\s.]+)+$/.test(value) ? undefined : 'Enter a complete domain.'
        }
      />
      <TagsInput
        label="Duplicate · retained draft"
        initialValues={['Research']}
        initialDraft="Research"
        initialError="Nothing added. Line 1: “Research” is already included."
      />
    </div>
  );
}

function validateEmail(value: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Enter a complete email address.';
}

function BatchLab(): ReactElement {
  const [version, setVersion] = useState(0);
  const [sample, setSample] = useState('editor@example.org\nmissing-domain\nreviewer@example.org');
  return (
    <div className="tags-demo-stack-proto">
      <TagsInput
        key={version}
        label="Recipients"
        initialValues={['team@example.org']}
        initialDraft={sample}
        initialError={
          sample.includes('missing-domain')
            ? 'Nothing added. Line 2: Enter a complete email address.'
            : ''
        }
        validate={validateEmail}
        maxTags={8}
        description="Fix missing-domain, then use Add. Valid lines wait with the rejected line; nothing disappears."
      />
      <div className="tags-demo-actions-proto">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() => {
            setSample('editor@example.org\nmissing-domain\nreviewer@example.org');
            setVersion(version + 1);
          }}
        >
          Load rejected batch
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          onClick={() => {
            setSample('editor@example.org\nreviewer@example.org');
            setVersion(version + 1);
          }}
        >
          Load valid batch
        </Button>
      </div>
    </div>
  );
}

export function TagsBatches(): ReactElement {
  return (
    <div className="tags-examples-proto">
      <Example title="Repair a batch · live local validation">
        <BatchLab />
      </Example>
      <Example title="Free text · punctuation is content">
        <TagsInput
          label="Places"
          initialValues={['Paris, Texas', 'New York']}
          initialDraft="Portland, Maine"
          description="Commas and spaces do not split a tag. Paste one tag per line to add a batch."
        />
      </Example>
      <Example title="Rejected batch · capacity">
        <TagsInput
          label="Topics"
          initialValues={['Research']}
          initialDraft={'History\nPhotography\nInterviews'}
          maxTags={3}
          initialError="Nothing added. This batch exceeds the 3-tag limit. 2 places available."
        />
      </Example>
      <Example title="Four visible lines · native scroll beyond">
        <TagsInput
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

function ReadingLab(): ReactElement {
  const [readOnly, setReadOnly] = useState(false);
  return (
    <div className="tags-demo-stack-proto">
      <TagsInput
        label="Subjects"
        initialValues={['Oral history', 'Paris, Texas']}
        initialDraft="Not yet added"
        readOnly={readOnly}
        description={
          readOnly
            ? 'Read only. Select and copy the full values.'
            : 'A draft is separate from accepted values.'
        }
      />
      <Button
        size="s"
        variant="secondary"
        tone="neutral"
        aria-pressed={readOnly}
        onClick={() => setReadOnly(!readOnly)}
      >
        {readOnly ? 'Resume editing' : 'Switch to read only'}
      </Button>
    </div>
  );
}

export function TagsAvailability(): ReactElement {
  return (
    <div className="tags-examples-proto">
      <Example title="Limit reached · remove to free a place">
        <TagsInput
          label="Topics"
          initialValues={['Research', 'History', 'Photography']}
          maxTags={3}
          description="The field stays readable. Removal and draft editing remain available."
        />
      </Example>
      <Example title="Limit reached · keep a draft">
        <TagsInput
          label="Topics"
          initialValues={['Research', 'History']}
          initialDraft="Interviews"
          maxTags={2}
          description="Remove either tag. Add becomes available without retyping the draft."
        />
      </Example>
      <Example title="Read only · all values, no actions">
        <TagsInput
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
          label="Topics"
          initialValues={['Research', 'Field notes']}
          initialDraft={'Oral history\nUnreviewed material'}
          readOnly
          description="The draft is retained separately and is not part of the accepted values."
        />
      </Example>
      <Example title="Disabled · populated">
        <TagsInput
          label="Topics"
          initialValues={['Research', 'Field notes']}
          disabled
          description="Editing is unavailable while the collection is being transferred."
        />
      </Example>
      <Example title="Disabled · empty Ghost">
        <TagsInput
          label="Topics"
          variant="ghost"
          disabled
          description="Choose a collection before adding topics."
        />
      </Example>
      <Example title="Live transition · editing ↔ reading">
        <ReadingLab />
      </Example>
    </div>
  );
}

export function TagsOverflow(): ReactElement {
  const address = 'digital-collections-and-research-coordination@example.org';
  return (
    <div className="tags-examples-proto">
      <Example title="Long values · readable in place">
        <TagsInput
          label="Recipients"
          initialValues={[address, 'editor@example.org']}
          description="Complete values wrap inside their tags. Hover and focus keep the layout still."
        />
      </Example>
      <Example title="Long identifier · no hidden text">
        <TagsInput
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
          label="Subject"
          initialDraft="A descriptive subject with enough detail to wrap naturally within a narrow field without turning into a tiny horizontal viewport"
          description="The first wrap opens the editor across the field, with dedicated space beside the text for Add."
        />
      </Example>
      <Example title="Bounded draft · full-width scroll">
        <TagsInput
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
          label="Recipients"
          initialValues={[address, 'editor@example.org']}
          disabled
          description="Editing is temporarily unavailable. Values remain readable and selectable."
        />
      </Example>
      <Example title="Mixed reading directions">
        <TagsInput
          label="Research languages and places"
          initialValues={['Paris, Texas', 'العمارة', 'עברית', '東京']}
          description="The interface mirrors; each accepted string preserves its own reading direction."
        />
      </Example>
      <Example title="Long label and help">
        <TagsInput
          label="Subjects used to organize the collection and its public discovery page"
          initialValues={['Digital preservation']}
          description="Use specific, meaningful phrases. The label, help, feedback, and complete values all wrap at narrow widths and with larger text."
        />
      </Example>
    </div>
  );
}

export function TagsDrafts(): ReactElement {
  const draft =
    'one@example.org\ntwo@example.org\nthree@example.org\nfour@example.org\nfive@example.org\nsix@example.org\nseven@example.org';
  return (
    <div className="tags-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example
          key={variant}
          title={`${variant === 'default' ? 'Default' : 'Ghost'} · full-width draft`}
        >
          <div className="tags-demo-stack-proto">
            <TagsInput
              label="Short draft · no scrollbar"
              variant={variant}
              initialValues={['team@example.org']}
              initialDraft="one@example.org"
            />
            <TagsInput
              label="Two lines · no scrollbar"
              variant={variant}
              initialValues={['team@example.org']}
              initialDraft={'one@example.org\ntwo@example.org'}
            />
            {(['s', 'm', 'l'] as const).map((size) => (
              <TagsInput
                key={size}
                size={size}
                variant={variant}
                label={`${size.toUpperCase()} · Recipients`}
                initialValues={['team@example.org']}
                initialDraft={draft}
                description="Text scrolls to the field edge. Add keeps its own space."
              />
            ))}
          </div>
        </Example>
      ))}
    </div>
  );
}

export function TagsSurfaces(): ReactElement {
  return (
    <div className="tags-examples-proto">
      <div className="tags-material-proto">
        <div className="tags-example-title-proto">Base · a form slot</div>
        <Input label="Collection" defaultValue="Field notes" />
        <TagsInput
          label="Topics"
          initialValues={['Research', 'Oral history']}
          placeholder="Add a topic…"
        />
        <TagsInput
          variant="ghost"
          label="Inline topics"
          initialValues={['Archive']}
          placeholder="Add a topic…"
        />
      </div>
      <div className="tags-overlay-stage-proto">
        <div className="tags-material-underlay-proto" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="tags-material-proto" data-surface="overlay">
          <div className="tags-example-title-proto">Overlay · the same field</div>
          <Input label="Collection" defaultValue="Field notes" />
          <TagsInput
            label="Topics"
            initialValues={['Research', 'Oral history']}
            placeholder="Add a topic…"
          />
          <TagsInput
            variant="ghost"
            label="Inline topics"
            initialValues={['Archive']}
            placeholder="Add a topic…"
          />
        </div>
      </div>
    </div>
  );
}

export function TagsSubmission(): ReactElement {
  const id = useId();
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="tags-examples-proto">
      <Example title="Draft protection · local native form">
        <form
          className="tags-demo-stack-proto"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <TagsInput
            id={id}
            label="Topics"
            initialValues={['Research']}
            initialDraft="Unadded topic"
            onValuesChange={() => setSubmitted(false)}
            onDraftChange={() => setSubmitted(false)}
            description="Continue with a draft: the editor explains what remains. Add or clear the draft, then continue. Leaving the field never accepts it."
          />
          <div className="tags-demo-actions-proto">
            <Button type="submit" variant="secondary" tone="neutral">
              Continue
            </Button>
          </div>
          {submitted && (
            <p className="tags-demo-note-proto" role="status">
              Ready to continue. No unadded draft remains.
            </p>
          )}
        </form>
      </Example>
      <Example title="Ghost · a compact property">
        <TagsInput
          label="Topics"
          variant="ghost"
          initialValues={['Research', 'Field notes']}
          description="The same editing model in a quieter inline field. No suggestions, hidden picker, or automatic acceptance on blur."
        />
      </Example>
    </div>
  );
}
