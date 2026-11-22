import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  AppShell,
  AsidePanel,
  DocumentTabs,
  Header,
  LeftRail,
  TopRail,
} from '../../../src/prototypes/app-shell/app-shell.proto.js';
import { Button } from '../../../src/prototypes/button/button.proto.js';

const documents = [
  'Platform architecture',
  'Research interviews',
  'Interview synthesis',
  'Workshop notes',
  'Planning checklist',
  'Field observations',
].map((label, index) => ({ value: String(index), label }));

export default function AppShellFixture(): ReactElement {
  const [items, setItems] = useState(documents);
  const [current, setCurrent] = useState('0');
  return (
    <AppShell
      canvasAs="section"
      viewportHeight={480}
      topRail={
        <TopRail>
          <DocumentTabs
            items={items}
            value={current}
            onValueChange={setCurrent}
            onAdd={() => {
              const value = String(items.length);
              setItems([...items, { value, label: `Untitled ${value}` }]);
              setCurrent(value);
            }}
          />
        </TopRail>
      }
      leftRail={<LeftRail />}
      leftAside={<AsidePanel title="Workspace">Document tree</AsidePanel>}
      header={
        <Header actions={<Button size="s">New note</Button>}>
          <div>
            <div>Platform engineering</div>
            <div>Document collection</div>
          </div>
        </Header>
      }
      rightAside={
        <AsidePanel side="right" title="Document properties">
          <label>
            Reference <input defaultValue="RS-104" />
          </label>
        </AsidePanel>
      }
    >
      <p>Document canvas</p>
    </AppShell>
  );
}
