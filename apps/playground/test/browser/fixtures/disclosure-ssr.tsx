import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement } from 'react';

const rawTarget = {
  popovertarget: 'unrelated-overlay',
  popovertargetaction: 'show',
} as unknown as Record<string, never>;

const rawPanel = { ID: 'foreign', HIDDEN: '', INERT: '', 'aria-label': 'Draft panel' };

export default function DisclosureSsr(): ReactElement {
  const [open, setOpen] = useState(false);
  const [accept, setAccept] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAccept(true)}>
        Accept disclosure
      </button>
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          if (accept) {
            setOpen(next);
          }
        }}
        lazyMount
      >
        <CollapsibleTrigger {...rawTarget}>Reveal report</CollapsibleTrigger>
        <CollapsibleTrigger asChild>
          <Button
            {...rawTarget}
            commandFor="unrelated-overlay"
            command="show-popover"
            popoverTarget="unrelated-overlay"
          >
            Second report trigger
          </Button>
        </CollapsibleTrigger>
        <CollapsibleTrigger asChild {...rawTarget}>
          <button {...rawTarget}>Native report trigger</button>
        </CollapsibleTrigger>
        <CollapsibleContent {...rawPanel}>
          <input aria-label="Report draft" defaultValue="draft" />
        </CollapsibleContent>
      </Collapsible>
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Visible report</CollapsibleTrigger>
        <CollapsibleContent {...rawPanel}>
          <input aria-label="Visible draft" defaultValue="visible" />
        </CollapsibleContent>
      </Collapsible>
      <div id="unrelated-overlay" popover="manual">
        Unrelated overlay
      </div>
    </>
  );
}
