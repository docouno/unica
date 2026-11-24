import { lazy, Suspense, useState } from 'react';
import { componentCompositions } from '../../../src/workbench/schema.js';
import type { SceneDefinition } from '../../../src/workbench/types.js';

const ContextMenuExample = lazy(async () => {
  const { default: contextMenu } = await import('../../../src/specimens/menu/context-menu.spec.js');
  const NativeContextMenu = componentCompositions(contextMenu).find(
    ({ id }) => id === 'native',
  )?.render;
  if (!NativeContextMenu) {
    throw new Error('Missing native context menu example');
  }
  return {
    default: () => (
      <NativeContextMenu
        ctx={{
          id: 'context-menu-fixture',
          tab: 'compositions',
          theme: {
            id: 'soft-dark',
            label: 'Soft Dark',
            family: 'soft',
            familyLabel: 'Soft',
            colorScheme: 'dark',
          },
          surface: 'base',
          comparing: false,
          subject: { 'data-wb-subject': '' },
          form: { 'data-wb-form': '' },
          action: () => () => undefined,
        }}
      />
    ),
  };
});

const scenePreview = ({ default: scene }: { default: SceneDefinition }) => ({
  default: scene.render,
});

const examples = {
  'Folio sign-in': lazy(() => import('../../../src/scenes/01-sign-in.scene.js').then(scenePreview)),
  'Folio collection': lazy(() =>
    import('../../../src/scenes/03-document-collection.scene.js').then(scenePreview),
  ),
  'Folio reader': lazy(() =>
    import('../../../src/scenes/04-document-reader.scene.js').then(scenePreview),
  ),
  'Folio editor': lazy(() =>
    import('../../../src/scenes/05-rich-editor.scene.js').then(scenePreview),
  ),
  'Folio preferences': lazy(() =>
    import('../../../src/scenes/09-user-preferences.scene.js').then(scenePreview),
  ),
  'Build queue': lazy(async () => ({
    default: (await import('../../../src/prototypes/table/table.examples.js')).BuildQueue,
  })),
  'Context menu': ContextMenuExample,
  'Form field groups': lazy(async () => ({
    default: (await import('../../../src/specimens/form-field/field-groups.js')).Groups,
  })),
  'List actions': lazy(async () => ({
    default: (await import('../../../src/prototypes/list/list.examples.js')).LiveRows,
  })),
};

export default function BinaryConsumersFixture() {
  const [example, setExample] = useState<keyof typeof examples>();
  const Example = example ? examples[example] : null;
  return (
    <>
      <nav aria-label="Composition examples">
        {(Object.keys(examples) as (keyof typeof examples)[]).map((name) => (
          <button key={name} type="button" onClick={() => setExample(name)}>
            {name}
          </button>
        ))}
      </nav>
      <Suspense fallback={null}>
        {Example && (
          <div data-testid={example}>
            {example === 'Form field groups' ? (
              <form>
                <Example />
              </form>
            ) : (
              <Example />
            )}
          </div>
        )}
      </Suspense>
    </>
  );
}
