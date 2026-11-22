import { useRef, useState } from 'react';
import type { JSX } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Tooltip,
  TooltipProvider,
} from '@docouno/unica';
import type { HoverPreviewChangeDetails } from '@docouno/unica';

const copyText = 'Read and copy these preview details about the team.';

export default function HoverPreviewFixture(): JSX.Element {
  const [notices, setNotices] = useState<string[]>([]);
  const [outsideClicks, setOutsideClicks] = useState(0);
  const [linkClick, setLinkClick] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const outside = useRef<HTMLButtonElement>(null);

  const report = (id: string) => (open: boolean, details: HoverPreviewChangeDetails) => {
    const event = details.originalEvent;
    const target = details.reason === 'outside-press' ? event?.composedPath()[0] : event?.target;
    const suffix = target instanceof HTMLElement && target.id ? `:${target.id}` : '';
    setNotices((previous) => [...previous, `${id}:${open}:${details.reason}${suffix}`]);
  };

  return (
    <div style={{ padding: '70px 30px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Tooltip label="First hint" id="first-preview" onOpenChange={report('first')}>
          <button type="button" id="first-source" disabled={disabled}>
            First source
          </button>
        </Tooltip>
        <Tooltip label="Second hint" id="second-preview" onOpenChange={report('second')}>
          <button type="button" id="second-source">
            Second source
          </button>
        </Tooltip>
        <TooltipProvider delay={600}>
          <Tooltip label="Separate hint" id="separate-preview">
            <button type="button" id="separate-source">
              Separate source
            </button>
          </Tooltip>
        </TooltipProvider>
        <Tooltip
          label="Owned hint"
          id="owned-preview"
          open={commitOpen}
          onOpenChange={report('owned')}
        >
          <button type="button" id="owned-source">
            Owned source
          </button>
        </Tooltip>
        <button type="button" id="commit-open" onClick={() => setCommitOpen(true)}>
          Commit open
        </button>
        <button type="button" id="disable-source" onClick={() => setDisabled(true)}>
          Disable first
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'start', gap: 16, marginBlockStart: 46 }}>
        <HoverCard onOpenChange={report('preview')}>
          <HoverCardTrigger
            id="preview-source"
            href="#destination"
            onClick={(event) => setLinkClick(`click:${event.ctrlKey}:${event.defaultPrevented}`)}
            onAuxClick={(event) => setLinkClick(`aux:${event.button}:${event.defaultPrevented}`)}
          >
            Team
          </HoverCardTrigger>
          <HoverCardContent id="team-preview" align="center" style={{ maxBlockSize: 200 }}>
            <p id="preview-copy" style={{ margin: 0 }}>
              {copyText}
            </p>
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i} style={{ margin: 0 }}>
                Detail {i + 1}
              </p>
            ))}
          </HoverCardContent>
        </HoverCard>
        <button
          type="button"
          id="outside"
          ref={outside}
          onClick={() => setOutsideClicks((count) => count + 1)}
        >
          Outside action
        </button>
        <button type="button" id="flat-invoker" popoverTarget="flat-auto">
          Standalone popover
        </button>
        <div id="flat-auto" popover="auto" style={{ padding: 20 }}>
          <Tooltip label="Nested hint" id="flat-preview" onOpenChange={report('flat')}>
            <button type="button" id="flat-source">
              Standalone source
            </button>
          </Tooltip>
        </div>
        <button type="button" id="open-dialog" onClick={() => dialog.current?.showModal()}>
          Open dialog
        </button>
      </div>
      <dialog ref={dialog} id="preview-dialog" aria-label="Preview test dialog">
        <button type="button" popoverTarget="preview-auto">
          Open popover
        </button>
        <div id="preview-auto" popover="auto" style={{ padding: 20 }}>
          <Tooltip
            label="Nested controlled hint"
            id="dialog-preview"
            open={rejectOpen}
            onOpenChange={(open, details) => {
              report('dialog')(open, details);
              if (details.reason === 'escape' && !open) {
                const escapeCount = notices.filter((notice) =>
                  notice.startsWith('dialog:false:escape'),
                ).length;
                if (escapeCount > 0) {
                  setRejectOpen(false);
                }
              } else if (open) {
                setRejectOpen(true);
              }
            }}
          >
            <button
              type="button"
              id="dialog-source"
              onKeyDown={(event) => {
                if (event.key === 'Escape' && event.shiftKey) {
                  event.preventDefault();
                }
              }}
            >
              Nested source
            </button>
          </Tooltip>
        </div>
      </dialog>
      <div id="destination" style={{ marginBlockStart: 30 }}>
        Team destination
      </div>
      <Tooltip
        label="Redirected hint"
        id="redirected-preview"
        onOpenChange={(open, details) => {
          report('redirected')(open, details);
          if (open) {
            outside.current?.focus();
          }
        }}
      >
        <button type="button" id="redirected-source">
          Redirect focus on open
        </button>
      </Tooltip>
      <output id="preview-notices" hidden>
        {JSON.stringify(notices)}
      </output>
      <output id="outside-clicks" hidden>
        {outsideClicks}
      </output>
      <output id="link-click" hidden>
        {linkClick}
      </output>
    </div>
  );
}
