import type { SpecimenDefinition } from '../../workbench/types.js';
const { default: definition } = await import('./date-picker.examples.js');
const specimen: SpecimenDefinition = definition;
export default specimen;
