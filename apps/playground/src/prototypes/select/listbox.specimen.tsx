import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Card } from '../card/card.proto.js';
import { Listbox, SelectPanel } from './select.proto.js';
import { regionOptions, roleOptions, simpleOptions } from './select.data.js';
import { Study, StudyNote } from './select.examples.js';

function LiveList(): ReactElement {
  const [values, setValues] = useState<readonly string[]>(['amsterdam', 'london']);
  return (
    <div className="select-study-stack-proto">
      <StudyNote>
        Tab into the list. Arrows browse; Space or Enter toggles. Typing jumps by name. Browse to
        the last region to inspect scrolling.
      </StudyNote>
      <Listbox
        className="select-study-frame-proto select-study-scroll-proto"
        title="Available regions"
        options={regionOptions}
        multiple
        values={values}
        onValuesChange={setValues}
      />
      <div className="select-study-result-proto" aria-live="polite">
        Selected:{' '}
        {values.length
          ? values
              .map((value) => regionOptions.find((option) => option.value === value)?.label)
              .join(', ')
          : 'None'}
      </div>
    </div>
  );
}

export default defineSpecimen({
  id: 'listbox',
  title: 'Listbox',
  group: 'Forms',
  summary: 'A quiet, always-visible choice list. Selection, navigation and focus remain distinct.',
  sections: [
    {
      id: 'sizes',
      title: 'Density · S / M / L',
      kind: 'matrix',
      render: () => (
        <div className="select-study-grid-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <Study key={size} title={`${size.toUpperCase()} · single selection`}>
              <Listbox
                size={size}
                options={simpleOptions}
                defaultValue="editor"
                aria-label={`Role ${size}`}
              />
              <Listbox
                size={size}
                options={[
                  { value: 'plain', label: 'Without a description' },
                  { value: 'icon', label: 'With an icon', icon: roleOptions[0]?.icon },
                  {
                    value: 'description',
                    label: 'With a description',
                    description: 'A second line of context.',
                  },
                  {
                    value: 'wrapped',
                    label: 'A longer option label that continues on another line',
                  },
                  {
                    value: 'rich',
                    label: 'Publishing permissions',
                    icon: roleOptions[1]?.icon,
                    description: 'Review and publish changes across all shared workspaces.',
                  },
                ]}
                defaultValue="icon"
                aria-label={`Mixed row anatomy ${size}`}
              />
            </Study>
          ))}
        </div>
      ),
    },
    {
      id: 'anatomy',
      title: 'Descriptions, icons & groups',
      kind: 'matrix',
      render: () => (
        <div className="select-study-grid-proto">
          <Study
            title="Single · rich options"
            note="The check column is always reserved. Icons share a leading column, even when a row has none."
          >
            <Listbox
              options={[
                ...roleOptions,
                {
                  value: 'custom',
                  label: 'Custom policy',
                  description: 'Use the policy defined by your organization',
                  group: 'Administration',
                },
              ]}
              defaultValue="editor"
              aria-label="Role with descriptions"
            />
          </Study>
          <Study
            title="Multiple · immediate toggles"
            note="No nested checkboxes and no modifier keys. The selected row stays neutral."
          >
            <Listbox
              options={simpleOptions}
              multiple
              defaultValues={['viewer', 'editor']}
              aria-label="Multiple roles"
            />
          </Study>
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Selection × pointer × keyboard',
      kind: 'states',
      render: () => (
        <div className="select-study-grid-proto">
          {(
            [
              ['Available', false, undefined],
              ['Selected', true, undefined],
              ['Hover', false, 'hover'],
              ['Selected + hover', true, 'hover'],
              ['Pressed', true, 'pressed'],
              ['Keyboard focus', false, 'focus'],
              ['Selected + focus', true, 'focus'],
            ] as const
          ).map(([title, selected, preview]) => (
            <Study key={title} title={title}>
              <Listbox
                options={[{ value: 'editor', label: 'Editor' }]}
                value={selected ? 'editor' : null}
                previewOption="editor"
                previewState={preview}
                aria-label={title}
              />
            </Study>
          ))}
          <StudyNote>
            These labeled state pins compare appearance; they do not move DOM focus. Live navigation
            is in Long content & bounded scrolling.
          </StudyNote>
        </div>
      ),
    },
    {
      id: 'availability',
      title: 'Read only, disabled & unavailable',
      kind: 'states',
      render: () => (
        <div className="select-study-grid-proto">
          <Study title="Read only · browse safely">
            <Listbox title="Workspace role" options={roleOptions} value="editor" readOnly />
          </Study>
          <Study title="Disabled · selection retained">
            <Listbox options={simpleOptions} value="editor" disabled aria-label="Disabled roles" />
          </Study>
          <Study title="Selected option disabled">
            <Listbox options={roleOptions} value="admin" aria-label="Administrative role" />
          </Study>
          <Study
            title="Removed from catalog"
            note="Select the retained row to remove only that answer. It cannot be added again."
          >
            <Listbox
              options={simpleOptions}
              multiple
              defaultValues={['editor', 'maintainer']}
              orphanLabels={{ maintainer: 'Maintainer' }}
              aria-label="Saved roles"
            />
          </Study>
          <Study
            title="Only saved answer remains"
            note="Explicit removal also works when there is no replacement available."
          >
            <Listbox
              options={[]}
              defaultValue="maintainer"
              orphanLabels={{ maintainer: 'Maintainer' }}
              aria-label="Unavailable saved role"
            />
          </Study>
          <Study title="Empty catalog">
            <Listbox
              options={[]}
              aria-label="No roles available"
              emptyState="No roles available in this workspace."
            />
          </Study>
          <Study
            title="Unavailable · locked"
            note="Read-only and disabled retained answers explain their status without inviting removal."
          >
            <Listbox
              options={[]}
              value="maintainer"
              orphanLabels={{ maintainer: 'Maintainer' }}
              readOnly
              title="Saved role"
            />
            <Listbox
              options={[]}
              value="maintainer"
              orphanLabels={{ maintainer: 'Maintainer' }}
              disabled
              aria-label="Disabled saved role"
            />
          </Study>
          <Study
            title="All options disabled"
            note="Keyboard focus falls back to the list when no row can receive it."
          >
            <Listbox
              options={simpleOptions.map((option) => ({ ...option, disabled: true }))}
              value="editor"
              aria-label="Locked roles"
            />
          </Study>
        </div>
      ),
    },
    {
      id: 'overflow',
      title: 'Long content & bounded scrolling',
      kind: 'states',
      render: () => (
        <div className="select-study-grid-proto">
          <Study title="Long label & description">
            <Listbox
              options={[
                {
                  value: 'long',
                  label: 'Organization-wide editorial and publishing permissions',
                  description:
                    'Review changes across every workspace, including archived projects and externally shared pages.',
                },
                {
                  value: 'url',
                  label: 'https://example.com/workspaces/engineering/permission-policies',
                  description: 'A long, unbroken value wraps without horizontal scrolling.',
                },
              ]}
              defaultValue="long"
              aria-label="Long permission labels"
            />
          </Study>
          <LiveList />
        </div>
      ),
    },
    {
      id: 'surfaces',
      title: 'One row anatomy · base & floating surface',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => (
        <div className="select-study-grid-proto">
          <Study
            title="Transparent list inside Card"
            note="The shared Card supplies the quiet parent surface. The list owns no background, border or shadow."
          >
            <Card data-surface="base" variant="subtle" size="s">
              <Listbox options={simpleOptions} defaultValue="editor" aria-label="Inline role" />
            </Card>
          </Study>
          <Study
            title="Inside SelectPanel"
            note="The surrounding panel owns the material; rows keep the same anatomy."
          >
            <SelectPanel>
              <Listbox
                size="m"
                options={simpleOptions}
                defaultValue="editor"
                aria-label="Floating role"
              />
            </SelectPanel>
          </Study>
        </div>
      ),
    },
  ],
});
