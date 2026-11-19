import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';
import { Button } from '../prototypes/button/button.proto.js';
import { DatePicker } from '../prototypes/date-picker/date-picker.proto.js';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../prototypes/dialog/dialog.proto.js';
import { ToastCard } from '../prototypes/toast/toast.proto.js';
import { FormField } from '../prototypes/input/input.proto.js';
import { Combobox } from '../prototypes/combobox/combobox.proto.js';
import type { Suggestion } from '../prototypes/combobox/combobox.proto.js';
import { CheckboxCard, RadioCard } from '../prototypes/choice-card/choice-card.proto.js';
import { Textarea } from '../prototypes/textarea/textarea.proto.js';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { defineScene } from '../workbench/types.js';
import { FolioScene, FolioWorkspace, RunbookArticle } from './folio/folio.shared.js';

const reviewers = [
  {
    value: 'network',
    label: 'Core networking',
    description: 'Staff Engineer',
    group: 'Core Infrastructure',
  },
  {
    value: 'edge',
    label: 'Edge reliability',
    description: 'Edge SRE',
    group: 'Core Infrastructure',
  },
] as const satisfies readonly Suggestion[];

function PropertiesScene(): ReactElement {
  const formId = useId();
  const scopeId = useId();
  const visibilityName = useId();
  const [open, setOpen] = useState(true);
  const [properties, setProperties] = useState<{
    visibility: 'workspace' | 'responders';
    paging: boolean;
    date: string;
    scope: string;
    reviewer: Suggestion | null;
  }>({
    visibility: 'workspace',
    paging: true,
    date: '2027-01-15',
    scope: 'Verify synchronous standby lag and VIP fencing script.',
    reviewer: reviewers[0],
  });
  const [draft, setDraft] = useState(properties);
  const [saved, setSaved] = useState(false);
  const changeOpen = (next: boolean): void => {
    if (next) {
      setDraft(properties);
    }
    setOpen(next);
  };
  return (
    <FolioScene>
      <Drawer open={open} onOpenChange={changeOpen}>
        <div inert={open}>
          <FolioWorkspace
            breadcrumb={
              <Breadcrumb size="s">
                <BreadcrumbLink href="?item=02-workspace-overview">Platform Eng</BreadcrumbLink>
                <BreadcrumbLink href="?item=03-document-collection">Runbooks</BreadcrumbLink>
                <BreadcrumbPage>Zero-Downtime PG Failover</BreadcrumbPage>
              </Breadcrumb>
            }
            documentTabs
            activeDocument="runbook"
            minHeight={1200}
            actions={
              <DrawerTrigger
                size="s"
                variant="secondary"
                tone="neutral"
                iconLeft={SlidersHorizontalIcon}
              >
                Properties
              </DrawerTrigger>
            }
          >
            <div className="folio-prose-stage">
              <RunbookArticle compact />
            </div>
          </FolioWorkspace>
        </div>
        <DrawerContent
          className="folio-properties-dialog"
          side={{ wide: 'end', narrow: 'bottom' }}
          described
        >
          <DrawerHeader closeLabel="Close document properties">
            <DrawerTitle>Document properties & review</DrawerTitle>
            <DrawerDescription>
              Configure visibility, incident automation, and review cadence.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <form
              id={formId}
              className="folio-stack-lg"
              onSubmit={(event) => {
                event.preventDefault();
                setProperties(draft);
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
                    checked={draft.visibility === 'workspace'}
                    onChange={() => setDraft({ ...draft, visibility: 'workspace' })}
                    label="Workspace internal"
                    description="All 14 engineers"
                  />
                  <RadioCard
                    name={visibilityName}
                    value="responders"
                    checked={draft.visibility === 'responders'}
                    onChange={() => setDraft({ ...draft, visibility: 'responders' })}
                    label="Incident responders"
                    description="SRE on-call only"
                  />
                </div>
              </fieldset>
              <CheckboxCard
                checked={draft.paging}
                onChange={(event) => setDraft({ ...draft, paging: event.currentTarget.checked })}
                label="Page on-call when verification expires"
                description={<bdi>Opens a low-urgency PagerDuty review note if overdue.</bdi>}
              />
              <DatePicker
                label="Next verification date"
                size="s"
                value={draft.date}
                onValueChange={(date) => setDraft({ ...draft, date })}
                today="2027-01-05"
                min="2027-01-05"
                clearable
              />
              <FormField label="Verification scope" htmlFor={scopeId}>
                <Textarea
                  id={scopeId}
                  size="s"
                  rows={2}
                  value={draft.scope}
                  onChange={(event) => setDraft({ ...draft, scope: event.currentTarget.value })}
                  aria-label="Verification scope"
                />
              </FormField>
              <Combobox
                label="Backup reviewer"
                size="s"
                defaultSelection={draft.reviewer ?? undefined}
                onSelectionChange={(reviewer) => setDraft({ ...draft, reviewer })}
                options={reviewers}
              />
            </form>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose>Cancel</DrawerClose>
            <Button type="submit" form={formId}>
              Save properties
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {saved && (
        <div className="folio-toast-dock">
          <ToastCard
            status="success"
            title="Document properties saved"
            onDismiss={() => setSaved(false)}
          >
            Visibility and review cadence updated for this document.
          </ToastCard>
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
