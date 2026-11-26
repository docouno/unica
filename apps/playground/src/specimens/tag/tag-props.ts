export const tagSize = {
  kind: 'enum',
  group: 'Geometry',
  default: 'm',
  publicType: 'TagSize',
  description: 'Set the label, leading glyph and remove plate size.',
  choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
} as const;

export function referenceProp(publicType: string, description: string) {
  return {
    kind: 'action',
    group: 'References',
    publicType,
    description,
    code: 'undefined',
  } as const;
}
