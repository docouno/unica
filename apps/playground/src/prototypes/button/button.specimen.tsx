import { defineSpecimen } from '../../workbench/types.js';
import {
  EditorExample,
  ImportExample,
  LightExample,
  OverflowExamples,
  OverlayExample,
  PopoverExample,
  RoleExamples,
  SignInExample,
  SizeExamples,
  StateExamples,
  ToggleExamples,
} from './button.examples.js';

export default defineSpecimen({
  id: 'button',
  title: 'Button & IconButton',
  group: 'Actions',
  summary:
    'Three action weights, three tones. Tactile materials, quiet toggles, and steady loading geometry.',
  sections: [
    { id: 'light', title: 'Light & response', kind: 'states', render: LightExample },
    { id: 'roles', title: 'Role × tone', kind: 'matrix', render: RoleExamples },
    { id: 'sizes', title: 'Sizes, slots & squares', kind: 'matrix', render: SizeExamples },
    {
      id: 'states',
      title: 'Interaction & availability',
      kind: 'states',
      caption:
        'Pinned visual states; hover and keyboard focus also work on every available button.',
      render: StateExamples,
    },
    {
      id: 'toggles',
      title: 'Live toggles & pending actions',
      kind: 'states',
      render: ToggleExamples,
    },
    {
      id: 'overflow',
      title: 'Long labels & stable loading',
      kind: 'states',
      render: OverflowExamples,
    },
    {
      id: 'sign-in',
      title: 'Folio · Sign in',
      kind: 'context',
      caption:
        'Native email field stands in for the Input family. Authentication is a visual preview.',
      render: SignInExample,
    },
    {
      id: 'editor',
      title: 'Folio · Workspace & editor',
      kind: 'context',
      caption: 'Toggle Bold, Italic, or Pin while the primary publishing action stays distinct.',
      render: EditorExample,
    },
    {
      id: 'popover',
      title: 'Folio · Share note',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      caption: 'Static Popover stand-in; close and copy actions preview visual placement.',
      render: PopoverExample,
    },
    {
      id: 'invite',
      title: 'Folio · Invite access',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static Modal and native Input stand-ins. Send and Cancel update local preview feedback.',
      render: OverlayExample,
    },
    { id: 'import', title: 'Folio · Workspace import', kind: 'context', render: ImportExample },
  ],
});
