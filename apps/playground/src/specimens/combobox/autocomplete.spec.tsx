import { defineComponent } from '../../workbench/types.js';
import { Autocomplete } from '../../prototypes/combobox/combobox.proto.js';
import {
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  required,
  toggle,
  eventProp,
} from '../control-props.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  AutocompleteRoles,
  AutocompleteRows,
  AutocompleteAvailability,
  AutocompleteResponses,
  AutocompleteOverflow,
  FreeTitle,
} from './autocomplete.examples.js';
import { titles } from './document-titles.js';
import { InsertBlock } from './insert-block.js';
import commandsSource from './block-commands.ts?raw';
import insertSource from './insert-block.tsx?raw';
import './autocomplete-matrix.css';

const messages = {
  neutral: '',
  info: 'Suggestions come from your recent drafts.',
  success: 'The title check passed.',
  warning: 'A draft already uses this title.',
  danger: 'Choose a different title before sharing.',
};

export default defineComponent({
  id: 'autocomplete',
  title: 'Autocomplete',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'Edit free text and optionally complete it with a plain suggestion or a grouped command.',
  componentName: 'Autocomplete',
  form: 'owned',
  props: {
    size,
    variant,
    status: {
      ...status,
      description: 'Field feedback. Each non-neutral status has a pinned example message.',
    },
    width,
    disabled,
    readOnly,
    required,
    browsable: toggle('Interaction', 'Show a control to browse the available suggestions.'),
    onTextChange: eventProp(
      'Receives the edited or inserted text.',
      '(text) => console.log(text)',
      '(text: string) => void',
    ),
    onSuggestion: eventProp(
      'Receives the chosen suggestion. The event log displays its value.',
      '(suggestion) => console.log(suggestion.value)',
      '(suggestion: Suggestion) => void',
    ),
  },
  render: withOverlaySurface(({ values, ctx }) => {
    const message = !values.disabled && messages[values.status];
    return (
      <form {...ctx.form} data-autocomplete-comparison="" style={{ inlineSize: '100%' }}>
        <Autocomplete
          {...values}
          {...ctx.subject}
          name="title"
          label="Document title"
          options={titles}
          defaultValue="Release notes"
          message={message ? <bdi>{message}</bdi> : undefined}
          onTextChange={ctx.action('onTextChange')}
          onSuggestion={(suggestion) => ctx.action('onSuggestion')(suggestion.value)}
        />
      </form>
    );
  }, 'border-box'),
  code: (values) => {
    const attrs = previewProps(values, {
      size: 'm',
      variant: 'default',
      status: 'neutral',
      width: 'full',
      disabled: false,
      readOnly: false,
      required: false,
      browsable: false,
    });
    const message = !values.disabled && messages[values.status];
    return `import { Autocomplete } from './prototypes/combobox/combobox.proto.js';
import '@docouno/unica/styles.css';

const titles = ${JSON.stringify(titles)};

export function DocumentTitle() {
  return <Autocomplete label="Document title" name="title" options={titles} defaultValue="Release notes"${attrs}${message ? ` message={<bdi>${previewText(message)}</bdi>}` : ''} onTextChange={(text) => console.log(text)} onSuggestion={(suggestion) => console.log(suggestion.value)} />;
}`;
  },
  states: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Roles and sizes',
      caption: 'Compare the bordered form field and inline editing role at each density.',
    },
  ],
  cases: [
    {
      id: 'recent-titles',
      title: 'Browsing, recent titles and intrinsic width',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'The small fields offer a browse action. The inline fields start with a recent title, and the large fields cap their width at 20rem.',
      render: withOverlaySurface(AutocompleteRoles, 'border-box'),
    },
    {
      id: 'rows',
      title: 'Plain and grouped suggestions',
      overlayStage: true,
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'The active plain title and grouped command are held open. Compare the text, description, glyph and shortcut columns.',
      render: withOverlaySurface(AutocompleteRows, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Availability and validation',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare locked and disabled fields with four feedback tones. Each message describes the document title shown above it.',
      render: withOverlaySurface(AutocompleteAvailability, 'border-box'),
    },
    {
      id: 'responses',
      title: 'Suggestion feedback',
      overlayStage: true,
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare search progress, minimum query length, empty results, failed lookup and unavailable commands while the current text remains visible.',
      render: withOverlaySurface(AutocompleteResponses, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long labels and shortcuts',
      overlayStage: true,
      kind: 'content',
      mode: 'pinned',
      caption:
        'The entered title stays on one line. Rich results wrap their descriptions and move the shortcut below the label in a narrow panel.',
      render: withOverlaySurface(AutocompleteOverflow, 'border-box'),
    },
    {
      id: 'free-text',
      title: 'Free text and recent titles',
      surface: 'overlay',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Save your own title or complete it from recent drafts. Escape dismisses suggestions and keeps your text.',
      render: (props) => (
        <div className="suggestion-live-stage-proto">
          <FreeTitle {...props} />
        </div>
      ),
    },
  ],
  compositions: [
    {
      id: 'editor',
      title: 'Insert a block',
      surface: 'overlay',
      mode: 'live',
      reset: true,
      caption:
        'Type / to browse block commands. Choose a suggestion or press Enter on a complete command to confirm the insertion. The image gallery is unavailable.',
      code: insertSource
        .replace('../../prototypes/', './prototypes/')
        .replace("import { blocks } from './block-commands.js';", commandsSource.trim()),
      render: ({ ctx }) => (
        <div className="suggestion-live-stage-proto">
          <InsertBlock fieldProps={ctx.subject} surface={ctx.surface} />
        </div>
      ),
    },
  ],
});
