import type { SpecimenDefinition } from '../../workbench/types.js';
const { default: definition } = await import('./calendar.examples.js');
const specimen: SpecimenDefinition = definition;
export default specimen;
