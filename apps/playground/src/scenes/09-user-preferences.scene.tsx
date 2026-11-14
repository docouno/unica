import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { defineScene } from '../workbench/types.js';
import {
  AppShell,
  AsidePanel,
  BackToWorkspace,
  Header,
  SettingsNavigation,
  StickyActionBar,
} from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import { Breadcrumb } from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import { Card } from '../prototypes/card/card.proto.js';
import { Accordion, Collapsible } from '../prototypes/accordion/accordion.proto.js';
import { Toast } from '../prototypes/feedback/feedback.proto.js';
import { Kbd, KbdGroup } from '../prototypes/kbd/kbd.proto.js';
import { Radio, Switch } from '../prototypes/selection/selection.proto.js';
import { SegmentedControl } from '../prototypes/segmented-control/segmented-control.proto.js';
import { Select } from '../prototypes/select/select.proto.js';
import { NumberInput, RangeSlider, Slider } from '../prototypes/slider/slider.proto.js';
import { Table, TableScroll } from '../prototypes/table/table.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
import { FolioScene, SectionHeading } from './folio/folio.shared.js';
import './folio/folio.settings.css';

interface Preferences {
  readonly mode: string;
  readonly typeface: string;
  readonly measure: string;
  readonly scale: number;
  readonly autosave: number;
  readonly context: readonly [number, number];
  readonly collapse: boolean;
  readonly reminders: boolean;
  readonly signed: boolean;
  readonly watermark: boolean;
}

const defaults: Preferences = {
  mode: 'system',
  typeface: 'jetbrains',
  measure: 'balanced',
  scale: 100,
  autosave: 30,
  context: [3, 12],
  collapse: true,
  reminders: true,
  signed: true,
  watermark: true,
};
const initial: Preferences = { ...defaults, autosave: 15, watermark: false };

function PreferencesScene(): ReactElement {
  const [preferences, setPreferences] = useState<Preferences>(initial);
  const [saved, setSaved] = useState<Preferences>(defaults);
  const [notice, setNotice] = useState('');
  const measureName = useId();
  const dirty = (Object.keys(preferences) as (keyof Preferences)[]).filter(
    (key) => JSON.stringify(preferences[key]) !== JSON.stringify(saved[key]),
  ).length;
  function update<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  return (
    <FolioScene>
      <AppShell
        minHeight={1260}
        leftAside={
          <AsidePanel width={256} title="Preferences" leading={<BackToWorkspace />}>
            <SettingsNavigation />
          </AsidePanel>
        }
        header={
          <Header
            actions={
              <>
                <Badge status={dirty ? 'warning' : 'neutral'}>
                  {dirty ? `${dirty} unsaved changes` : 'All changes saved'}
                </Badge>
                <Button
                  size="s"
                  variant="ghost"
                  tone="neutral"
                  onClick={() => setPreferences(defaults)}
                >
                  Reset defaults
                </Button>
              </>
            }
          >
            <Breadcrumb items={['Platform engineer', 'Preferences', 'Appearance & editor']} />
          </Header>
        }
      >
        <div className="folio-settings-stage">
          <div className="folio-settings-column folio-preferences-column">
            <Card className="folio-preferences-card">
              <section className="folio-preference-row folio-preference-inline">
                <div className="folio-stack folio-preference-label">
                  <Text size="body-s" weight="medium">
                    Interface color mode
                  </Text>
                  <Text size="body-s" className="folio-preference-description" color="muted">
                    Follow operating system polarity or lock workspace theme.
                  </Text>
                </div>
                <SegmentedControl
                  size="s"
                  aria-label="Interface color mode"
                  items={[
                    { value: 'system', label: 'System' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'light', label: 'Light' },
                  ]}
                  value={preferences.mode}
                  onValueChange={(value) => update('mode', value)}
                />
              </section>
              <section className="folio-preference-row folio-preference-inline">
                <div className="folio-stack folio-preference-label">
                  <Text size="body-s" weight="medium">
                    Code &amp; terminal typeface
                  </Text>
                  <Text size="body-s" className="folio-preference-description" color="muted">
                    Monospace family rendered inside runbook snippets and SQL probes.
                  </Text>
                </div>
                <Select
                  size="s"
                  aria-label="Code and terminal typeface"
                  value={preferences.typeface}
                  onChange={(event) => update('typeface', event.currentTarget.value)}
                  options={[
                    { value: 'jetbrains', label: 'JetBrains Mono (13px)' },
                    { value: 'system', label: 'System monospace (13px)' },
                  ]}
                />
              </section>
              <section className="folio-preference-row">
                <div className="folio-stack folio-preference-label">
                  <Text size="body-s" weight="medium">
                    Editorial prose measure
                  </Text>
                  <Text size="body-s" className="folio-preference-description" color="muted">
                    Maximum reading column width for long-form architecture decisions and
                    postmortems.
                  </Text>
                </div>
                <div
                  className="folio-row folio-wrap folio-preference-radio-row"
                  role="group"
                  aria-label="Editorial prose measure"
                >
                  <Radio
                    name={measureName}
                    size="s"
                    value="compact"
                    checked={preferences.measure === 'compact'}
                    onChange={() => update('measure', 'compact')}
                    label="Compact (64ch)"
                  />
                  <Radio
                    name={measureName}
                    size="s"
                    value="balanced"
                    checked={preferences.measure === 'balanced'}
                    onChange={() => update('measure', 'balanced')}
                    label="Balanced (72ch)"
                  />
                  <Radio
                    name={measureName}
                    size="s"
                    value="wide"
                    checked={preferences.measure === 'wide'}
                    onChange={() => update('measure', 'wide')}
                    label="Wide (84ch)"
                  />
                </div>
              </section>
              <section className="folio-preference-row">
                <div className="folio-stack folio-preference-label">
                  <Text size="body-s" weight="medium">
                    Typography scale &amp; draft autosave
                  </Text>
                  <Text size="body-s" className="folio-preference-description" color="muted">
                    Adjust reading zoom and local snapshot frequency while editing.
                  </Text>
                </div>
                <div className="folio-preference-numeric-row">
                  <Slider
                    size="s"
                    label="Typography scale"
                    min={80}
                    max={140}
                    step={5}
                    value={preferences.scale}
                    onValueChange={(value) => update('scale', value)}
                    formatValue={(value) => `${value}%`}
                  />
                  <NumberInput
                    size="s"
                    label="Autosave interval (s)"
                    min={5}
                    max={120}
                    step={5}
                    value={preferences.autosave}
                    onValueChange={(value) => update('autosave', value)}
                  />
                </div>
              </section>
              <section className="folio-preference-row">
                <div className="folio-stack folio-preference-label">
                  <Text size="body-s" weight="medium">
                    Inline diff context window
                  </Text>
                  <Text size="body-s" className="folio-preference-description" color="muted">
                    Unchanged surrounding lines shown around each revision hunk.
                  </Text>
                </div>
                <div className="folio-preference-context">
                  <div className="folio-stack">
                    <div className="folio-row folio-between">
                      <Text size="caption-l">Context lines</Text>
                      <Text size="caption-l" color="muted">
                        {preferences.context[0]} — {preferences.context[1]} lines
                      </Text>
                    </div>
                    <RangeSlider
                      min={0}
                      max={20}
                      value={preferences.context}
                      onValueChange={(value) => update('context', value)}
                      aria-label="Diff context lines"
                    />
                  </div>
                  <Switch
                    size="s"
                    label="Collapse unchanged blocks"
                    checked={preferences.collapse}
                    onChange={(event) => update('collapse', event.currentTarget.checked)}
                  />
                </div>
              </section>
            </Card>
            <Card className="folio-governance-card">
              <SectionHeading>Review &amp; governance policies</SectionHeading>
              <Accordion>
                <Collapsible title="Stale runbook reminders" defaultOpen>
                  <div className="folio-row folio-between folio-preference-policy">
                    <Text size="body-s" color="secondary">
                      Notify primary owner 7 days before quarterly Tier-0 verification expires.
                    </Text>
                    <Switch
                      size="s"
                      aria-label="Stale runbook reminders"
                      checked={preferences.reminders}
                      onChange={(event) => update('reminders', event.currentTarget.checked)}
                    />
                  </div>
                </Collapsible>
                <Collapsible title="Signed commit verification">
                  <div className="folio-row folio-between">
                    <Text size="body-s" color="secondary">
                      Require signed commits before publishing repository-backed changes.
                    </Text>
                    <Switch
                      size="s"
                      aria-label="Signed commit verification"
                      checked={preferences.signed}
                      onChange={(event) => update('signed', event.currentTarget.checked)}
                    />
                  </div>
                </Collapsible>
                <Collapsible title="External share watermarking">
                  <div className="folio-row folio-between">
                    <Text size="body-s" color="secondary">
                      Mark externally shared snapshots with the workspace name.
                    </Text>
                    <Switch
                      size="s"
                      aria-label="External share watermarking"
                      checked={preferences.watermark}
                      onChange={(event) => update('watermark', event.currentTarget.checked)}
                    />
                  </div>
                </Collapsible>
              </Accordion>
            </Card>
            <section className="folio-stack">
              <SectionHeading>Keyboard shortcuts</SectionHeading>
              <TableScroll>
                <Table className="folio-shortcuts-table">
                  <thead>
                    <tr>
                      <th>Command</th>
                      <th>Scope</th>
                      <th>Shortcut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Search documents &amp; runbooks</td>
                      <td>Global workspace</td>
                      <td>
                        <KbdGroup>
                          <Kbd>⌘</Kbd>
                          <span>+</span>
                          <Kbd>K</Kbd>
                        </KbdGroup>
                      </td>
                    </tr>
                    <tr>
                      <td>Toggle metadata inspector</td>
                      <td>Document reader</td>
                      <td>
                        <KbdGroup>
                          <Kbd>⌘</Kbd>
                          <span>+</span>
                          <Kbd>⇧</Kbd>
                          <span>+</span>
                          <Kbd>I</Kbd>
                        </KbdGroup>
                      </td>
                    </tr>
                    <tr>
                      <td>Jump to verified runbooks</td>
                      <td>Navigation chord</td>
                      <td>
                        <KbdGroup>
                          <Kbd>G</Kbd>
                          <span>then</span>
                          <Kbd>R</Kbd>
                        </KbdGroup>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </TableScroll>
            </section>
            {notice && (
              <Toast status="success" title="Preferences saved" onDismiss={() => setNotice('')}>
                {notice}
              </Toast>
            )}
            <StickyActionBar
              className="folio-preferences-actions"
              actions={
                <>
                  <Button
                    size="s"
                    variant="secondary"
                    tone="neutral"
                    disabled={!dirty}
                    onClick={() => setPreferences(saved)}
                  >
                    Discard
                  </Button>
                  <Button
                    size="s"
                    disabled={!dirty}
                    onClick={() => {
                      setSaved(preferences);
                      setNotice('Your preferences have been saved.');
                    }}
                  >
                    Save preferences
                  </Button>
                </>
              }
            >
              <div className="folio-row">
                <span className="folio-preferences-status" data-dirty={dirty > 0 || undefined} />
                <Text size="body-s">
                  {dirty ? `${dirty} unsaved preference changes` : 'All preference changes saved'}
                </Text>
              </div>
            </StickyActionBar>
          </div>
        </div>
      </AppShell>
    </FolioScene>
  );
}

export default defineScene({
  id: '09-user-preferences',
  title: 'User Preferences & Numeric Controls',
  group: 'Folio',
  summary:
    'Personal preferences, numeric inputs, governance disclosures, and an unsaved changes bar.',
  defaultViewport: 1440,
  render: () => <PreferencesScene />,
});
