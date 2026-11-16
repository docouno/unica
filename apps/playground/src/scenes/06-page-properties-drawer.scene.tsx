import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';
import { Button } from '../prototypes/button/button.proto.js';
import { Calendar, DatePicker } from '../prototypes/date-picker/date-picker.proto.js';
import { Drawer } from '../prototypes/dialog/dialog.proto.js';
import { Toast } from '../prototypes/feedback/feedback.proto.js';
import { FormField } from '../prototypes/input/input.proto.js';
import { Combobox } from '../prototypes/select/select.proto.js';
import { CheckboxCard, RadioCard } from '../prototypes/choice-card/choice-card.proto.js';
import { Textarea } from '../prototypes/textarea/textarea.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
import { defineScene } from '../workbench/types.js';
import { FolioScene, FolioWorkspace, RunbookArticle } from './folio/folio.shared.js';

function PropertiesScene(): ReactElement {
  const formId = useId();
  const scopeId = useId();
  const visibilityName = useId();
  const [open, setOpen] = useState(true);
  const [visibility, setVisibility] = useState('workspace');
  const [paging, setPaging] = useState(true);
  const [date, setDate] = useState('2027-01-15');
  const [scope, setScope] = useState('Verify synchronous standby lag and VIP fencing script.');
  const [reviewer, setReviewer] = useState('Core');
  const [saved, setSaved] = useState(false);
  return (
    <FolioScene>
      <FolioWorkspace
        crumbs={['Platform Eng', 'Runbooks', 'Zero-Downtime PG Failover']}
        documentTabs
        activeDocument="runbook"
        minHeight={1200}
        actions={
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            iconLeft={SlidersHorizontalIcon}
            onClick={() => setOpen(true)}
          >
            Properties
          </Button>
        }
      >
        <div className="folio-prose-stage">
          <RunbookArticle compact />
        </div>
      </FolioWorkspace>
      <Drawer
        open={open}
        title="Document properties & review"
        description="Configure visibility, incident automation, and review cadence."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" tone="neutral" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Save properties
            </Button>
          </>
        }
      >
        <form
          id={formId}
          className="folio-stack-lg"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            setSaved(true);
          }}
        >
          <fieldset className="folio-fieldset">
            <legend>Space visibility</legend>
            <div className="folio-grid-2">
              <RadioCard
                name={visibilityName}
                value="workspace"
                checked={visibility === 'workspace'}
                onChange={() => setVisibility('workspace')}
                label="Workspace internal"
                description="All 14 engineers"
              />
              <RadioCard
                name={visibilityName}
                value="responders"
                checked={visibility === 'responders'}
                onChange={() => setVisibility('responders')}
                label="Incident responders"
                description="SRE on-call only"
              />
            </div>
          </fieldset>
          <CheckboxCard
            checked={paging}
            onChange={(event) => setPaging(event.currentTarget.checked)}
            label="Page on-call when verification expires"
            description="Opens a low-urgency PagerDuty review note if overdue."
          />
          <div className="folio-stack">
            <DatePicker
              label="Next verification date"
              size="s"
              value={date}
              onValueChange={setDate}
            />
            <Calendar key={date.slice(0, 7)} month={date} value={date} onSelect={setDate} />
            <Text size="caption-l" color="muted">
              Review due: {date === '2027-01-15' ? '15 Jan 2027' : date}
            </Text>
          </div>
          <FormField label="Verification scope" htmlFor={scopeId}>
            <Textarea
              id={scopeId}
              size="s"
              rows={2}
              value={scope}
              onChange={(event) => setScope(event.currentTarget.value)}
              aria-label="Verification scope"
            />
          </FormField>
          <Combobox
            label="Backup reviewer"
            size="s"
            defaultOpen
            value={reviewer}
            onValueChange={setReviewer}
            options={[
              {
                value: 'network',
                label: 'Core networking — Staff Engineer',
                group: 'Core Infrastructure',
              },
              { value: 'edge', label: 'Edge reliability — Edge SRE', group: 'Core Infrastructure' },
            ]}
          />
          <div className="folio-combobox-reserve" aria-hidden="true" />
        </form>
      </Drawer>
      {saved && (
        <div className="folio-toast-dock">
          <Toast title="Document properties saved" onDismiss={() => setSaved(false)}>
            Visibility and review cadence updated for this document.
          </Toast>
        </div>
      )}
    </FolioScene>
  );
}

export default defineScene({
  id: '06-page-properties-drawer',
  title: '06 · Page Properties & Relations Drawer',
  group: 'Folio',
  defaultViewport: 1440,
  render: () => <PropertiesScene />,
});
