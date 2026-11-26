import {
  Button,
  CheckboxCard,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  FormField,
  RadioCard,
  RadioCardGroup,
  Textarea,
  ToastProvider,
  useToast,
} from '@docouno/unica';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';
import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { OverlayExampleFrame } from '../examples/OverlayExampleFrame.js';
import { Combobox } from '../prototypes/combobox/combobox.proto.js';
import type { Suggestion } from '../prototypes/combobox/combobox.proto.js';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { DatePicker } from '../prototypes/date-picker/date-picker.proto.js';
import { defineScene } from '../workbench/types.js';
import type { SceneContext } from '../workbench/types.js';
import { folioSceneHref } from './folio/folio.routes.js';
import { FolioScene, FolioWorkspace, RunbookArticle } from './folio/folio.shared.js';
import { FolioToastRegion } from './folio/folio.toast.js';

const workspaceHeight = 1200;
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

function PropertiesWorkspace(): ReactElement {
  const toast = useToast();
  const formId = useId();
  const scopeId = useId();
  const visibilityId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
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
  const changeOpen = (next: boolean): void => {
    if (next) {
      setDraft(properties);
    }
    setOpen(next);
  };
  return (
    <FolioScene className="folio-overlay-workspace">
      <Drawer open={open} onOpenChange={changeOpen}>
        <FolioWorkspace
          breadcrumb={
            <Breadcrumb size="s">
              <BreadcrumbLink href={folioSceneHref('02-workspace-overview')}>
                Platform Eng
              </BreadcrumbLink>
              <BreadcrumbLink href={folioSceneHref('03-document-collection')}>
                Runbooks
              </BreadcrumbLink>
              <BreadcrumbPage>Zero-Downtime PG Failover</BreadcrumbPage>
            </Breadcrumb>
          }
          documentTabs
          activeDocument="runbook"
          minHeight={workspaceHeight}
          actions={
            <DrawerTrigger asChild>
              <Button
                ref={trigger}
                size="s"
                variant="secondary"
                tone="neutral"
                iconLeft={SlidersHorizontalIcon}
              >
                Properties
              </Button>
            </DrawerTrigger>
          }
        >
          <div className="folio-prose-stage">
            <RunbookArticle compact />
          </div>
        </FolioWorkspace>
        <DrawerContent
          className="folio-properties-dialog"
          side={{ wide: 'end', narrow: 'bottom' }}
          returnFocus={trigger}
        >
          <DrawerHeader>
            <div>
              <DrawerTitle>Document properties & review</DrawerTitle>
              <DrawerDescription>
                Configure visibility, incident automation, and review cadence.
              </DrawerDescription>
            </div>
            <DrawerClose aria-label="Close document properties" />
          </DrawerHeader>
          <DrawerBody>
            <form
              id={formId}
              className="folio-stack-lg"
              onSubmit={(event) => {
                event.preventDefault();
                setProperties(draft);
                setOpen(false);
                toast.show({
                  status: 'success',
                  title: 'Document properties saved',
                  description: 'Visibility and review cadence updated for this document.',
                });
              }}
            >
              <fieldset className="folio-fieldset">
                <legend id={visibilityId}>Space visibility</legend>
                <RadioCardGroup
                  className="folio-grid-2"
                  aria-labelledby={visibilityId}
                  value={draft.visibility}
                  onValueChange={(next) => {
                    if (next === 'workspace' || next === 'responders') {
                      setDraft({ ...draft, visibility: next });
                    }
                  }}
                >
                  <RadioCard
                    value="workspace"
                    label="Workspace internal"
                    description="All 14 engineers"
                  />
                  <RadioCard
                    value="responders"
                    label="Incident responders"
                    description="SRE on-call only"
                  />
                </RadioCardGroup>
              </fieldset>
              <CheckboxCard
                checked={draft.paging}
                onCheckedChange={(next) => setDraft({ ...draft, paging: next })}
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
              <FormField label="Verification scope" controlId={scopeId}>
                <Textarea
                  id={scopeId}
                  size="s"
                  rows={2}
                  value={draft.scope}
                  onChange={(event) => setDraft({ ...draft, scope: event.currentTarget.value })}
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
            <DrawerClose asChild>
              <Button variant="secondary" tone="neutral">
                Cancel
              </Button>
            </DrawerClose>
            <Button type="submit" form={formId}>
              Save properties
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <FolioToastRegion />
    </FolioScene>
  );
}

function PropertiesScene({ ctx }: { readonly ctx?: SceneContext }): ReactElement {
  const workspace = (
    <ToastProvider>
      <PropertiesWorkspace />
    </ToastProvider>
  );
  return ctx ? (
    <OverlayExampleFrame
      ctx={ctx}
      title="Folio page properties"
      height={workspaceHeight}
      className="folio-scene-frame"
      modal
      linksToParent
    >
      {workspace}
    </OverlayExampleFrame>
  ) : (
    workspace
  );
}

export default defineScene({
  id: '06-page-properties-drawer',
  title: '06 · Page Properties & Relations Drawer',
  group: 'Folio',
  defaultViewport: 1440,
  uses: [
    'alert',
    'app-shell',
    'badge',
    'breadcrumb',
    'button',
    'checkbox-card',
    'code',
    'combobox',
    'date-picker',
    'drawer',
    'form-field',
    'icon',
    'indicator',
    'radio-card',
    'table',
    'text',
    'textarea',
    'title',
    'toast',
  ],
  render: PropertiesScene,
});
