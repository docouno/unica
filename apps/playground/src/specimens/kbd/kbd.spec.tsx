import { Kbd } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import { defineComponent } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  ActionContext,
  OverlayContext,
  OwnerStates,
  Surfaces,
  actionsCode,
} from './kbd.contexts.js';
import { Keycaps, Notation, Reflow, Sizing } from './kbd.examples.js';
import { KeyboardViewport } from './kbd.viewport.js';

export default defineComponent({
  id: 'kbd',
  title: 'Kbd',
  category: 'Typography',
  status: 'UI',
  summary: 'A passive keycap for a key name, symbol or compact shortcut.',
  componentName: 'Kbd',
  props: {
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'inherit',
      description: 'Use the surrounding line height or an explicit key size.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    children: {
      kind: 'string',
      group: 'Content',
      publicType: 'ReactNode',
      default: 'K',
      description:
        'A key name, key symbol or short input hint. The editor starts with the letter K. Empty content leaves the keycap out.',
      examples: ['K', 'Enter', 'Esc', '/', '0', ''],
    },
    label: {
      kind: 'string',
      group: 'Semantics',
      publicType: 'string',
      default: '',
      description:
        'Replace the spoken key name, for example with a local pronunciation. Blank labels preserve the default reading.',
      examples: ['', 'Command key'],
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { children: '' },
      affects: ['label'],
      reason: 'An empty keycap has no rendered content to label.',
    },
  ],
  render: ({ ctx, values: { children, label, size } }) => (
    <ExampleSurface surface={ctx.surface}>
      <KeyboardViewport label="Key preview">
        <Kbd {...ctx.subject} label={label || undefined} size={size}>
          {children}
        </Kbd>
      </KeyboardViewport>
    </ExampleSurface>
  ),
  code: ({ children, ...props }) =>
    `<Kbd${previewProps(props, { size: 'inherit', label: '' })}>${previewText(children)}</Kbd>`,
  states: [
    {
      id: 'sizing',
      rows: 'size',
      cols: 'children',
      title: 'Key content at each size',
      caption:
        'Compare a letter, a named key, punctuation and a digit at the inherited and explicit sizes. The empty value leaves the cell without a keycap.',
      fixed: { label: '' },
    },
  ],
  cases: [
    {
      id: 'rhythm',
      title: 'Keys within a line of type',
      kind: 'content',
      mode: 'pinned',
      caption:
        'An inherited keycap takes its height from the surrounding line. Compare a caption, body text and a heading with explicitly sized keys.',
      render: Sizing,
    },
    {
      id: 'keys',
      title: 'Key names and symbols',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Read the letter, punctuation, modifier, navigation and named keys. Recognized symbols have spoken text equivalents.',
      render: Keycaps,
    },
    {
      id: 'notation',
      title: 'Chords, sequences and alternatives',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Read simultaneous keys together and sequential steps in order. Compact symbols and localized names keep a spoken reading.',
      render: Notation,
    },
    {
      id: 'surfaces',
      title: 'A key hint beside a search field',
      kind: 'surface',
      mode: 'live',
      caption:
        'Compare a keycap in prose, on a card and beside a field. Type to filter the list, then press Escape in the field to clear it.',
      render: Surfaces,
      reset: true,
    },
    {
      id: 'overlay',
      title: 'Hints in menus and tooltips',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      caption:
        'Focus or hover the formatting button to reveal its tooltip. Open Document commands to see active and unavailable commands with their shortcuts.',
      render: OverlayContext,
      reset: true,
    },
    {
      id: 'reflow',
      title: 'Narrow layouts and long key names',
      kind: 'content',
      mode: 'live',
      caption:
        'Chords keep their left-to-right order, and longer sequences can break between steps. Use the arrow keys to scroll the bounded reference.',
      render: Reflow,
    },
    {
      id: 'owner-states',
      title: 'Available and unavailable shortcut hints',
      kind: 'behavior',
      mode: 'live',
      caption:
        'The owning button supplies the foreground, focus treatment and activation. Compare a ready action with its disabled and loading states.',
      controls: {
        state: {
          kind: 'enum',
          label: 'Action state',
          default: 'ready',
          choices: ['ready', 'disabled', 'loading'],
        },
        variant: {
          kind: 'enum',
          label: 'Button variant',
          default: 'primary',
          choices: ['primary', 'secondary', 'ghost'],
        },
        tone: {
          kind: 'enum',
          label: 'Button tone',
          default: 'accent',
          choices: ['accent', 'neutral', 'danger'],
        },
      },
      reset: true,
      render: OwnerStates,
    },
  ],
  compositions: [
    {
      id: 'actions',
      title: 'Save a document label',
      mode: 'live',
      reset: true,
      caption:
        'Edit the label and press Enter to save. The keycap shares the button’s foreground, and keyboard focus stays with the field and its action.',
      code: actionsCode,
      render: ActionContext,
    },
  ],
});
