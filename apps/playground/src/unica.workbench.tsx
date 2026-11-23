import * as UnicaPackage from '@docouno/unica';
import { validateCatalog } from './workbench/schema.js';
import type {
  ComponentDefinition,
  ComponentDocsSource,
  SceneDefinition,
  WorkbenchConfig,
} from './workbench/types.js';
import { unicaWorkbenchBase } from './unica.workbench.shared.js';

// Type the results separately so Vitest detects glob calls and refreshes the catalog.
const componentModules: Record<string, ComponentDefinition> = import.meta.glob(
  './specimens/**/*.spec.tsx',
  { eager: true, import: 'default' },
);

const sceneModules: Record<string, SceneDefinition> = import.meta.glob('./scenes/**/*.scene.tsx', {
  eager: true,
  import: 'default',
});

const uiDocsModules: Record<string, () => Promise<string>> = import.meta.glob<string>(
  '../../../docs/components/*.md',
  { query: '?raw', import: 'default' },
);

const protoDocsModules: Record<string, () => Promise<string>> = import.meta.glob<string>(
  './prototypes/*/README.md',
  { query: '?raw', import: 'default' },
);

const familyByComponentId = new Map<string, string>();
for (const [modulePath, component] of Object.entries(componentModules)) {
  const match = /^\.\/specimens\/([^/]+)\//.exec(modulePath);
  if (match?.[1]) {
    familyByComponentId.set(component.id, match[1]);
  }
}

const components: readonly ComponentDefinition[] = Object.values(componentModules).sort((a, b) =>
  a.title.localeCompare(b.title),
);

const componentIds = new Set(components.map((entry) => entry.id));
const exportedUnicaNames = new Set(Object.keys(UnicaPackage));

const scenes: readonly SceneDefinition[] = Object.values(sceneModules).sort((a, b) =>
  a.id.localeCompare(b.id),
);

function resolveUnicaDocs(component: ComponentDefinition): ComponentDocsSource | undefined {
  const family = familyByComponentId.get(component.id);
  const candidates = family && family !== component.id ? [component.id, family] : [component.id];

  if (component.status === 'UI') {
    for (const slug of candidates) {
      const key = `../../../docs/components/${slug}.md`;
      const loader = uiDocsModules[key];
      if (loader) {
        return {
          importFrom: '@docouno/unica',
          markdown: loader,
          sourceLabel: `docs/components/${slug}.md`,
        };
      }
    }
    return { importFrom: '@docouno/unica' };
  }

  for (const slug of candidates) {
    const key = `./prototypes/${slug}/README.md`;
    const loader = protoDocsModules[key];
    if (loader) {
      return {
        markdown: loader,
        sourceLabel: `apps/playground/src/prototypes/${slug}/README.md`,
      };
    }
  }
  return undefined;
}

function resolveUnicaDocLink(
  href: string,
): { readonly item: string; readonly tab?: 'usage' } | undefined {
  const clean = href.split('#')[0] ?? '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean) || /^[/\\]{2}/.test(clean)) {
    return undefined;
  }
  const uiDoc = /^(?:\.\/)?([a-z0-9-]+)\.md$/.exec(clean);
  if (uiDoc?.[1] && componentIds.has(uiDoc[1])) {
    return { item: uiDoc[1], tab: 'usage' };
  }
  const crossDoc = /(?:^|\/)docs\/components\/([a-z0-9-]+)\.md$/.exec(clean);
  if (crossDoc?.[1] && componentIds.has(crossDoc[1])) {
    return { item: crossDoc[1], tab: 'usage' };
  }
  const protoDoc = /^\.\.\/([a-z0-9-]+)\/README\.md$/.exec(clean);
  if (protoDoc?.[1] && componentIds.has(protoDoc[1])) {
    return { item: protoDoc[1], tab: 'usage' };
  }
  return undefined;
}

export const unicaWorkbench: WorkbenchConfig = {
  ...unicaWorkbenchBase,
  components,
  scenes,
  docs: {
    defaultImportFrom: '@docouno/unica',
    exportedNames: exportedUnicaNames,
    resolve: resolveUnicaDocs,
    resolveDocLink: resolveUnicaDocLink,
  },
};

validateCatalog(unicaWorkbench);
