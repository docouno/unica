import { Card, Checkbox, Kbd, KbdGroup, Radio, RadioGroup, Text } from '@docouno/unica';
import { useId, useRef, useState } from 'react';
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
import { Badge } from '@docouno/unica';
import { Breadcrumb, BreadcrumbPage } from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../prototypes/disclosure/disclosure.proto.js';
import { ToastCard } from '../prototypes/toast/toast.proto.js';
import { SegmentedControl } from '../prototypes/segmented-control/segmented-control.proto.js';
import { Select } from '../prototypes/select/select.proto.js';
import { RangeSlider, Slider } from '../prototypes/slider/slider.proto.js';
import { NumberInput } from '../prototypes/number-input/number-input.proto.js';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableScroll,
} from '../prototypes/table/table.proto.js';
import { folioSceneHref } from './folio/folio.routes.js';
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
  const stage = useRef<HTMLDivElement>(null);
  const lastEdited = useRef<HTMLElement>(null);
  const typeface = useRef<HTMLButtonElement>(null);
  const dirty = (Object.keys(preferences) as (keyof Preferences)[]).filter(
    (key) => JSON.stringify(preferences[key]) !== JSON.stringify(saved[key]),
  ).length;
  function update<K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
    source?: HTMLElement | null,
  ): void {
    const active = source ?? document.activeElement;
    if (active instanceof HTMLElement && stage.current?.contains(active)) {
      lastEdited.current = active;
    }
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function restoreEditorFocus(): void {
    window.requestAnimationFrame(() => {
      const target = lastEdited.current;
      if (target?.getClientRects().length && !target.matches(':disabled, [aria-disabled="true"]')) {
        target.focus();
      } else {
        stage.current?.closest<HTMLElement>('.app-shell-main')?.focus({ preventScroll: true });
      }
    });
  }

  return (
    <FolioScene>
      <AppShell
        canvasAs="section"
        viewportHeight="clamp(380px, calc(100svh - 11rem), 860px)"
        leftAside={
          <AsidePanel
            width={256}
            title="Preferences"
            leading={<BackToWorkspace href={folioSceneHref('02-workspace-overview')} />}
          >
            <SettingsNavigation />
          </AsidePanel>
        }
        header={
          <Header
            actions={
              <>
                <Badge size="s" status={dirty ? 'warning' : 'neutral'}>
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
            <Breadcrumb size="s">
              <span>Platform engineer</span>
              <span>Preferences</span>
              <BreadcrumbPage>Appearance & editor</BreadcrumbPage>
            </Breadcrumb>
          </Header>
        }
      >
        <div ref={stage} className="folio-settings-stage folio-preferences-stage">
          <div className="folio-settings-column folio-preferences-column">
            <Card className="folio-preferences-card">
              <section className="folio-preference-row folio-preference-inline">
                <div className="folio-stack folio-preference-label">
                  <Text size="body-s" weight="medium">
                    Interface color mode
                  </Text>
                  <Text size="body-xs" color="muted">
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
                  <Text size="body-xs" color="muted">
                    Monospace family rendered inside runbook snippets and SQL probes.
                  </Text>
                </div>
                <Select
                  ref={typeface}
                  size="s"
                  aria-label="Code and terminal typeface"
                  value={preferences.typeface}
                  onValueChange={(value) => {
                    if (value) {
                      update('typeface', value, typeface.current);
                    }
                  }}
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
                  <Text size="body-xs" color="muted">
                    Maximum reading column width for long-form architecture decisions and
                    postmortems.
                  </Text>
                </div>
                <RadioGroup
                  className="folio-row folio-wrap folio-preference-radio-row"
                  orientation="horizontal"
                  name={measureName}
                  value={preferences.measure}
                  onValueChange={(value) => {
                    if (value === 'compact' || value === 'balanced' || value === 'wide') {
                      update('measure', value);
                    }
                  }}
                  aria-label="Editorial prose measure"
                >
                  <Radio size="s" value="compact" label="Compact (64ch)" />
                  <Radio size="s" value="balanced" label="Balanced (72ch)" />
                  <Radio size="s" value="wide" label="Wide (84ch)" />
                </RadioGroup>
              </section>
              <section className="folio-preference-row">
                <div className="folio-stack folio-preference-label">
                  <Text size="body-s" weight="medium">
                    Typography scale &amp; draft autosave
                  </Text>
                  <Text size="body-xs" color="muted">
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
                    label="Autosave interval"
                    aria-label="Autosave interval in seconds"
                    suffix="s"
                    min={5}
                    max={120}
                    step={5}
                    value={preferences.autosave}
                    onValueChange={(value) => {
                      if (value !== '') {
                        update('autosave', value);
                      }
                    }}
                  />
                </div>
              </section>
              <section className="folio-preference-row">
                <div className="folio-stack folio-preference-label">
                  <Text size="body-s" weight="medium">
                    Inline diff context window
                  </Text>
                  <Text size="body-xs" color="muted">
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
                      size="s"
                      min={0}
                      max={20}
                      value={preferences.context}
                      onValueChange={(value) => update('context', value)}
                      aria-label="Diff context lines"
                    />
                  </div>
                  <Checkbox
                    size="s"
                    label="Collapse unchanged blocks"
                    checked={preferences.collapse}
                    onCheckedChange={(next) => update('collapse', next)}
                  />
                </div>
              </section>
            </Card>
            <Card className="folio-governance-card">
              <SectionHeading>Review &amp; governance policies</SectionHeading>
              <Accordion headingLevel={3} size="s" defaultValue={['reminders']}>
                <AccordionItem value="reminders">
                  <AccordionTrigger>Stale runbook reminders</AccordionTrigger>
                  <AccordionContent>
                    <div className="folio-row folio-between folio-preference-policy">
                      <p>
                        Notify primary owner 7 days before quarterly Tier-0 verification expires.
                      </p>
                      <Checkbox
                        size="s"
                        aria-label="Stale runbook reminders"
                        checked={preferences.reminders}
                        onCheckedChange={(next) => update('reminders', next)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="signed">
                  <AccordionTrigger>Signed commit verification</AccordionTrigger>
                  <AccordionContent>
                    <div className="folio-row folio-between folio-preference-policy">
                      <p>Require signed commits before publishing repository-backed changes.</p>
                      <Checkbox
                        size="s"
                        aria-label="Signed commit verification"
                        checked={preferences.signed}
                        onCheckedChange={(next) => update('signed', next)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="watermark">
                  <AccordionTrigger>External share watermarking</AccordionTrigger>
                  <AccordionContent>
                    <div className="folio-row folio-between folio-preference-policy">
                      <p>Mark externally shared snapshots with the workspace name.</p>
                      <Checkbox
                        size="s"
                        aria-label="External share watermarking"
                        checked={preferences.watermark}
                        onCheckedChange={(next) => update('watermark', next)}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
            <section className="folio-stack">
              <SectionHeading>Keyboard shortcuts</SectionHeading>
              <TableScroll aria-label="Keyboard shortcuts">
                <Table aria-label="Keyboard shortcuts" className="folio-shortcuts-table">
                  <TableHeader>
                    <TableRow>
                      <TableColumnHeader>Command</TableColumnHeader>
                      <TableColumnHeader>Scope</TableColumnHeader>
                      <TableColumnHeader>Shortcut</TableColumnHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableRowHeader>Search documents &amp; runbooks</TableRowHeader>
                      <TableCell>Global workspace</TableCell>
                      <TableCell>
                        <KbdGroup>
                          <Kbd>⌘</Kbd>
                          <Kbd>K</Kbd>
                        </KbdGroup>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableRowHeader>Toggle metadata inspector</TableRowHeader>
                      <TableCell>Document reader</TableCell>
                      <TableCell>
                        <KbdGroup>
                          <Kbd>⌘</Kbd>
                          <Kbd>⇧</Kbd>
                          <Kbd>I</Kbd>
                        </KbdGroup>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableRowHeader>Jump to verified runbooks</TableRowHeader>
                      <TableCell>Navigation chord</TableCell>
                      <TableCell>
                        <KbdGroup separator="then">
                          <Kbd>G</Kbd>
                          <Kbd>R</Kbd>
                        </KbdGroup>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableScroll>
            </section>
            {notice && (
              <ToastCard status="success" title="Preferences saved" onDismiss={() => setNotice('')}>
                {notice}
              </ToastCard>
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
                    onClick={() => {
                      setPreferences(saved);
                      restoreEditorFocus();
                    }}
                  >
                    Discard
                  </Button>
                  <Button
                    size="s"
                    disabled={!dirty}
                    onClick={() => {
                      setSaved(preferences);
                      setNotice('Your preferences have been saved.');
                      restoreEditorFocus();
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
  uses: [
    'accordion',
    'app-shell',
    'badge',
    'breadcrumb',
    'button',
    'card',
    'checkbox',
    'icon',
    'kbd',
    'kbd-group',
    'number-input',
    'radio',
    'segmented-control',
    'select',
    'slider',
    'table',
    'text',
    'title',
    'toast',
  ],
  render: PreferencesScene,
});
