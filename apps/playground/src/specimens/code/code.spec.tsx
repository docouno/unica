import { Code } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  ActionsComposition,
  ReadingComposition,
  actionsCode,
  readingCode,
} from './code.compositions.js';
import {
  BoundariesExample,
  CodeFrame,
  MessagesExample,
  OverlayExample,
  PlainActions,
  SurfacesExample,
  WrappingExample,
} from './code.examples.js';

const defaultLiteral = 'git status --short';

export default defineComponent({
  id: 'code',
  title: 'Code',
  category: 'Typography',
  status: 'UI',
  summary: 'A selectable inline literal that follows the surrounding text and surface.',
  componentName: 'Code',
  props: {
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'inherit',
      description: 'Follow the surrounding type or use a body size and its line height.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    status: {
      kind: 'enum',
      group: 'Role',
      default: 'inherit',
      description: 'Follow the nearest painted surface or assign the literal an explicit status.',
      choices: [
        { value: 'inherit' },
        { value: 'neutral' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    plate: {
      kind: 'boolean',
      group: 'Role',
      default: true,
      description:
        'Paint the background and edge. Bare code with inherited status takes the surrounding text color.',
    },
    dir: {
      kind: 'enum',
      group: 'Semantics',
      default: 'ltr',
      description:
        'Set the base direction of the isolated literal. Auto uses its first strong character.',
      choices: [
        { value: 'ltr', label: 'LTR' },
        { value: 'rtl', label: 'RTL' },
        { value: 'auto', label: 'Auto' },
      ],
    },
    children: {
      kind: 'string',
      group: 'Content',
      publicType: 'ReactNode',
      default: defaultLiteral,
      description:
        'Inline content. The editor starts with a sample command. An empty literal has no visible plate.',
      examples: [
        defaultLiteral,
        '',
        '0',
        'retry()',
        'HTTP',
        'src/connections/reconnect-with-exponential-backoff.ts',
      ],
    },
  },
  render: ({ ctx, values: { children, ...props } }) => (
    <CodeFrame ctx={ctx}>
      <span dir={props.dir} style={{ textAlign: ctx.tab === 'playground' ? 'center' : undefined }}>
        <Code {...ctx.subject} {...props}>
          {children}
        </Code>
      </span>
    </CodeFrame>
  ),
  code: ({ children, ...props }) =>
    `<Code${previewProps(props, { size: 'inherit', status: 'inherit', plate: true, dir: 'ltr' })}>${previewText(children)}</Code>`,
  constraints: [
    {
      kind: 'ignored',
      when: { children: '' },
      affects: ['plate'],
      reason: 'An empty literal has no visible plate.',
    },
  ],
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'plate',
      title: 'Inherited and explicit sizes',
      caption:
        'Compare the surrounding scale with three explicit body sizes. Each literal also appears without its plate.',
      fixed: { children: 'retry()' },
    },
    {
      id: 'statuses',
      rows: 'status',
      cols: 'plate',
      title: 'Color with and without a plate',
      caption:
        'With an inherited status, bare code uses the surrounding text color. An explicit status colors the literal in either form.',
      fixed: { children: 'HTTP' },
    },
  ],
  cases: [
    {
      id: 'wrapping',
      title: 'Every character stays available',
      kind: 'content',
      mode: 'live',
      caption:
        'Select the wrapped path or the argument with two spaces. The request URL keeps its punctuation order on a right-to-left line.',
      render: WrappingExample,
    },
    {
      id: 'surfaces',
      title: 'Prose and cards',
      kind: 'surface',
      mode: 'pinned',
      caption: 'Compare the same header on the reading surface, a default card and a subtle card.',
      render: SurfacesExample,
    },
    {
      id: 'messages',
      title: 'Response codes in context',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Each message names its outcome. Compare a literal that follows the alert with one that carries an explicit status.',
      render: MessagesExample,
    },
    {
      id: 'boundaries',
      title: 'Text and nested surfaces',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Text passes the alert context through to plated code. A nested card supplies its own context, and bare code follows its host foreground.',
      render: BoundariesExample,
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      kind: 'surface',
      mode: 'pinned',
      overlayStage: true,
      surface: 'overlay',
      caption:
        'The static panel supplies the overlay material. An inherited plate and an explicit success plate share that surface.',
      render: OverlayExample,
    },
    {
      id: 'plain',
      title: 'Use the action foreground',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Tab between the two links. Bare code follows the foreground of both the button-shaped link and the inline link.',
      render: PlainActions,
    },
  ],
  compositions: [
    {
      id: 'reading',
      title: 'A reading passage',
      mode: 'pinned',
      caption:
        'Inline code follows each line’s size and keeps the weight of the heading and the emphasized instruction.',
      render: ReadingComposition,
      code: readingCode,
    },
    {
      id: 'controls',
      title: 'Configuration actions',
      mode: 'live',
      reset: true,
      caption:
        'Show or download the configuration, then follow the strict option to its reference. Unplated literals share each action’s foreground and focus target.',
      render: ActionsComposition,
      code: actionsCode,
    },
  ],
});
