import { createRef } from 'react';
import { defineGlyph, Tabs, TabsList, TabsPanel, TabsTrigger } from '../src/index.js';
import type {
  TabsActivationMode,
  TabsDistribution,
  TabsListMessages,
  TabsListProps,
  TabsMountStrategy,
  TabsOrientation,
  TabsPanelProps,
  TabsProps,
  TabsSize,
  TabsTriggerProps,
} from '../src/server.js';

const div = createRef<HTMLDivElement>();
const button = createRef<HTMLButtonElement>();
const size: TabsSize = 's';
const orientation: TabsOrientation = 'vertical';
const strategy: TabsMountStrategy = 'unmount';
const activationMode: TabsActivationMode = 'manual';
const distribution: TabsDistribution = 'equal';
const messages: TabsListMessages = { scrollBack: 'Earlier views', scrollForward: undefined };
const list: TabsListProps = {
  'aria-labelledby': 'list-title',
  ref: div,
  distribution: { tablet: distribution },
  messages,
};
const root: TabsProps = {
  value: undefined,
  defaultValue: 'x',
  size,
  orientation,
  activationMode,
  ref: div,
};
const glyph = defineGlyph(() => <svg />);
const trigger: TabsTriggerProps = {
  value: 'x',
  'aria-label': 'View',
  iconLeft: glyph,
  ref: button,
};
const panel: TabsPanelProps = { value: 'x', tabIndex: -1, mountStrategy: strategy, ref: div };
<Tabs {...root} onValueChange={(next: string) => next}>
  <TabsList {...list}>
    <TabsTrigger {...trigger} />
  </TabsList>
  <TabsPanel {...panel}>
    <input />
  </TabsPanel>
</Tabs>;

// @ts-expect-error The list needs an accessible name.
<TabsList />;
// @ts-expect-error Only a trigger participates in the tab sequence.
<TabsList aria-label="Documents" tabIndex={0} />;
// @ts-expect-error Icon-only tabs expose their name as a tooltip.
<TabsTrigger value="x" iconLeft={glyph} />;
// @ts-expect-error Text triggers take a string as their label.
<TabsTrigger value="x" children={<b>View</b>} />;
// @ts-expect-error The relationship IDs are owned by the component.
<TabsTrigger value="x" id="external">
  View
</TabsTrigger>;
// @ts-expect-error Individual availability is expressed with disabled.
<TabsTrigger value="x" hidden>
  View
</TabsTrigger>;
// @ts-expect-error Individual availability is expressed with disabled.
<TabsTrigger value="x" inert aria-hidden>
  View
</TabsTrigger>;
// @ts-expect-error Trigger refs are native button refs.
<TabsTrigger value="x" ref={div}>
  View
</TabsTrigger>;
// @ts-expect-error A tab changes panels inside one view.
<TabsTrigger value="x" asChild href="/">
  View
</TabsTrigger>;
// @ts-expect-error Panels own hidden and the tab relationship.
<TabsPanel value="x" hidden aria-labelledby="unrelated" />;
// @ts-expect-error Panel selection does not accept a numeric key.
<Tabs defaultValue={1} />;
