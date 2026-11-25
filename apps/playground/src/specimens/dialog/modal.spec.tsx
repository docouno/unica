import { DialogStudy } from '../../prototypes/dialog/dialog.examples.js';
import { defineComponent } from '../../workbench/types.js';
import { choice, eventProp, toggle } from '../control-props.js';
import { DeleteExport } from './delete-export.js';
import confirmationSource from './delete-export.tsx?raw';
import { EditProject } from './edit-project.js';
import { ExportDetails } from './export-details.js';
import detailsSource from './export-details.tsx?raw';
import { ReleaseReview } from './release-review.js';
import releaseSource from './release-review.tsx?raw';

const sizes = ['s', 'm', 'l'] as const;
const editableReview = releaseSource
  .replaceAll('../../prototypes/', './prototypes/')
  .replace('export function ReleaseReview', 'function ReleaseReview');

export default defineComponent({
  id: 'modal',
  title: 'Modal',
  category: 'Overlays',
  status: 'Proto',
  summary: 'A centered panel for a focused task, a decision or read-only details.',
  defaultSurface: 'overlay',
  props: {
    size: choice(
      'Geometry',
      'ModalContent density. Controls panel insets and spacing.',
      sizes,
      'm',
    ),
    width: choice(
      'Geometry',
      'ModalContent width ceiling. S, M and L use 24, 36 and 52rem within the available workspace.',
      sizes,
      'm',
    ),
    presentation: {
      ...choice(
        'Host',
        'Launch the panel or pin it for inspection. The standalone example opens from its trigger.',
        ['live', 'pinned'],
        'live',
      ),
      demo: true,
    },
    dismissOnBackdrop: toggle(
      'Interaction',
      'Dismiss ModalContent when a primary press and release both land on the backdrop.',
    ),
    onOpenChange: eventProp(
      'Modal reports a request to open or close. The owner decides whether to accept it.',
      '(open) => console.log(open)',
      '(open: boolean) => void',
    ),
  },
  render: ({ values, ctx }) => (
    <DialogStudy height={320}>
      <ReleaseReview
        contentProps={{
          size: values.size,
          width: values.width,
          dismissOnBackdrop: values.dismissOnBackdrop,
        }}
        pinned={values.presentation === 'pinned'}
        subject={ctx.subject}
        onOpenChange={ctx.action('onOpenChange')}
      />
    </DialogStudy>
  ),
  code: ({ size, width, dismissOnBackdrop }) =>
    `${editableReview}

export function PreviewRelease() {
  return <ReleaseReview contentProps={${JSON.stringify({ size, width, dismissOnBackdrop })}} />;
}`,
  states: [
    {
      id: 'dimensions',
      title: 'Panel dimensions',
      caption:
        'Each width group shows compact, regular and spacious insets. Panels stop at the workspace boundary. These comparisons stay open. Use Playground to launch and dismiss a panel.',
      rows: 'size',
      group: 'width',
      fixed: { presentation: 'pinned' },
    },
  ],
  cases: [
    {
      id: 'editor',
      title: 'Project editor and save feedback',
      overlayStage: true,
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: {
        width: {
          kind: 'enum',
          label: 'Width',
          default: 'm',
          choices: [
            { value: 's', label: 'S · 24rem' },
            { value: 'm', label: 'M · 36rem' },
            { value: 'l', label: 'L · 52rem' },
          ],
        },
        size: {
          kind: 'enum',
          label: 'Density',
          default: 'm',
          choices: [
            { value: 's', label: 'Compact' },
            { value: 'm', label: 'Regular' },
            { value: 'l', label: 'Spacious' },
          ],
        },
        status: {
          kind: 'enum',
          label: 'Save state',
          default: 'ready',
          choices: [
            { value: 'ready', label: 'Ready' },
            { value: 'invalid', label: 'Field error' },
            { value: 'pending', label: 'Saving' },
            { value: 'failed', label: 'Save failed' },
          ],
        },
      },
      caption:
        'Edit the project and save to restore the accepted values on the next opening. Field error marks the rejected name until you edit it. Saving holds submission. Try again accepts the retained draft and returns the save state to Ready.',
      render: EditProject,
    },
    {
      id: 'overflow',
      title: 'Long form and available height',
      overlayStage: true,
      kind: 'content',
      mode: 'live',
      reset: true,
      controls: {
        height: {
          kind: 'enum',
          label: 'Available height',
          default: 'roomy',
          choices: [
            { value: 'roomy', label: 'Reading area' },
            { value: 'short', label: 'Short window' },
            { value: 'keyboard', label: 'Keyboard inset' },
          ],
        },
      },
      caption:
        'Scroll to publishing and review settings. When less than 96px of reading space remains, the whole panel scrolls so its fields and save action stay reachable.',
      render: ({ ctx }) => <EditProject ctx={ctx} overflow />,
    },
    {
      id: 'guard',
      title: 'Unsaved changes',
      overlayStage: true,
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Change the name or description and request close. Keep editing returns to the draft. Discard changes restores the last saved project. Returning both fields to their saved values allows an immediate close.',
      render: ({ ctx }) => <EditProject ctx={ctx} guarded />,
    },
  ],
  compositions: [
    {
      id: 'confirmation',
      title: 'Destructive confirmation',
      overlayStage: true,
      mode: 'live',
      reset: true,
      caption:
        'Cancel keeps the November export available. Delete export marks it as deleted and moves focus to the result. Reset restores the export.',
      render: ({ ctx }) => (
        <DialogStudy height={340}>
          <DeleteExport subject={ctx.subject} />
        </DialogStudy>
      ),
      code: confirmationSource.replaceAll('../../prototypes/', './prototypes/'),
    },
    {
      id: 'details',
      title: 'Export details and notification',
      overlayStage: true,
      mode: 'live',
      reset: true,
      caption:
        'Inspect the November export and its ready notification. Dismiss the notice to return focus to the title. Close the panel or press its backdrop to return to the trigger.',
      render: ({ ctx }) => (
        <DialogStudy height={500}>
          <ExportDetails subject={ctx.subject} />
        </DialogStudy>
      ),
      code: detailsSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
