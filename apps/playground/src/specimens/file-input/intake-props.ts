import { eventProp, toggle } from '../control-props.js';

export const intakeProps = {
  allowPaste: toggle('Interaction', 'Accept files pasted directly on the focused picker.'),
  announceIntake: toggle('Accessibility', 'Announce each completed intake attempt.', true),
  accept: {
    kind: 'string',
    group: 'Admission',
    default: '.pdf,.txt',
    description: 'Comma-separated extensions and MIME types checked on each intake.',
  },
  maxSize: {
    kind: 'number',
    group: 'Admission',
    default: -1,
    examples: [-1, 0, 1024, 2_000_000],
    description: 'Maximum bytes per file. Leave at −1 in the inspector to omit the prop.',
  },
  maxFiles: {
    kind: 'number',
    group: 'Admission',
    default: -1,
    examples: [-1, 0, 1, 3],
    description:
      'Maximum files in the resulting selection. Leave at −1 in the inspector to omit the prop.',
  },
  onValueChange: eventProp(
    'Receives the complete next selection as File objects.',
    '(files) => console.log(files.map((file) => file.name))',
    '(files: readonly File[]) => void',
  ),
  onIntake: eventProp(
    'Receives the source, accepted files and file-specific rejections from each attempt.',
    '(result) => console.log(result)',
    '(result: FileIntakeResult) => void',
  ),
} as const;
