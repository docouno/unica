import { validateCatalog } from './workbench/schema.js';
import type { ComponentDefinition, SceneDefinition, WorkbenchConfig } from './workbench/types.js';
import { unicaWorkbenchBase } from './unica.workbench.shared.js';

const componentModules = import.meta.glob<ComponentDefinition>('./specimens/**/*.spec.tsx', {
  eager: true,
  import: 'default',
});

const sceneModules = import.meta.glob<SceneDefinition>('./scenes/**/*.scene.tsx', {
  eager: true,
  import: 'default',
});

const components: readonly ComponentDefinition[] = Object.values(componentModules).sort((a, b) =>
  a.title.localeCompare(b.title),
);

const scenes: readonly SceneDefinition[] = Object.values(sceneModules).sort((a, b) =>
  a.id.localeCompare(b.id),
);

export const unicaWorkbench: WorkbenchConfig = {
  ...unicaWorkbenchBase,
  components,
  scenes,
};

validateCatalog(unicaWorkbench);
