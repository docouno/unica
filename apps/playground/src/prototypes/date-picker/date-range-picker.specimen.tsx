import type { SpecimenDefinition } from '../../workbench/types.js';
const { default: definition } = await import('./date-range-picker.examples.js');
const specimen: SpecimenDefinition = definition;
export default specimen;
