import { useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { Tag, TooltipProvider } from '@docouno/unica';
import { DocumentTabs } from '../../../src/prototypes/app-shell/app-shell.proto.js';
import { TreeView } from '../../../src/prototypes/app-shell/navigation.proto.js';
import { Chip, ChipGroup } from '../../../src/prototypes/chip/chip.proto.js';
import { SearchGlyph } from '../../../src/prototypes/control-glyphs.js';
import { Tabs, TabsList, TabsTab } from '../../../src/prototypes/tabs/tabs.proto.js';

const folder = 'Operations documentation archive and reference materials';
const leaf = 'Platform release verification logs and review checklist';
const common = 'Shared components for publication';
const choices = [
  { value: 'alpha', label: `${common}, alpha` },
  { value: 'beta', label: `${common}, beta` },
] as const;

export default function CollectionHintsFixture(): ReactElement {
  const [changes, setChanges] = useState<string[]>([]);
  const [removals, setRemovals] = useState(0);
  const [planningLabel, setPlanningLabel] = useState('Release planning overview');
  return (
    <TooltipProvider delay={0}>
      <div style={{ display: 'grid', gap: 28, padding: 48 }}>
        <div style={{ inlineSize: 158 }}>
          <TreeView
            label="Workspace navigation"
            defaultExpanded={['library']}
            items={[
              {
                value: 'library',
                label: folder,
                children: [
                  { value: 'short', label: 'Notes' },
                  { value: 'long', label: leaf },
                ],
              },
            ]}
          />
        </div>
        <form style={{ '--chip-max-width': '128px' } as CSSProperties}>
          <ChipGroup
            label="Collection"
            name="collection"
            defaultValue="alpha"
            items={choices}
            onValueChange={(value) => setChanges((previous) => [...previous, value])}
          />
          <Chip name="review" value="yes">
            Request a publication review
          </Chip>
          <output data-testid="changes">{changes.join(',')}</output>
        </form>
        <div style={{ '--tag-max-width': '128px' } as CSSProperties}>
          <Tag
            removeLabel="Remove Release verification workflow"
            onRemove={() => setRemovals((value) => value + 1)}
          >
            Release verification workflow
          </Tag>
          <button type="button">After tag</button>
          <output data-testid="removals">{removals}</output>
        </div>
        <div data-testid="tabs-width" style={{ inlineSize: 320 }}>
          <Tabs defaultValue="plain">
            <TabsList aria-label="Views" distribution="equal">
              <TabsTab value="plain">Notes</TabsTab>
              <TabsTab value="planning">{planningLabel}</TabsTab>
              <TabsTab value="search" aria-label="Search" iconLeft={SearchGlyph} />
            </TabsList>
          </Tabs>
          <button
            type="button"
            onClick={() =>
              setPlanningLabel('Release planning overview and quarterly maintenance schedule')
            }
          >
            Extend planning title
          </button>
        </div>
        <DocumentTabs
          items={[
            { value: 'pinned', label: 'Guide', pinned: true },
            { value: 'plain', label: 'Index' },
          ]}
        />
      </div>
    </TooltipProvider>
  );
}
