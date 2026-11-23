import {
  Input,
  Kbd,
  KbdGroup,
  Link,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Text,
  Tooltip,
  TooltipProvider,
} from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ArrowCounterClockwiseIcon,
  ArrowSquareOutIcon,
  GearIcon,
  MagnifyingGlassIcon,
  SidebarSimpleIcon,
  StarIcon,
} from '@phosphor-icons/react';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import { OverlayPlacementStudy } from '../../examples/overlay-studies.js';
import { Button, IconButton } from '@docouno/unica';
import type { PreviewContext } from '../../workbench/types.js';

type ExampleProps = { readonly ctx: PreviewContext };

export function TooltipContentExamples({ ctx }: ExampleProps): ReactElement {
  const [example, setExample] = useState('shortcut');
  const description = 'Keep this panel visible while you browse other documents.';
  return (
    <div className="hint-study-stack">
      <div className="hint-study-controls">
        <label>
          Tooltip content
          <select value={example} onChange={(event) => setExample(event.currentTarget.value)}>
            <option value="label">Label</option>
            <option value="shortcut">Label and shortcut</option>
            <option value="description">Additional explanation</option>
          </select>
        </label>
      </div>
      <OverlayExampleFrame ctx={ctx} title="Tooltip content example" height={152}>
        <div className="hint-study-anchor" data-position="bottom-center">
          <Tooltip
            {...ctx.subject}
            label={example === 'description' ? description : 'Pin inspector'}
            describe={example === 'description'}
            shortcut={example === 'shortcut' ? '⌘I' : undefined}
            defaultOpen
          >
            <IconButton icon={SidebarSimpleIcon} aria-label="Pin inspector" size="s" />
          </Tooltip>
        </div>
      </OverlayExampleFrame>
    </div>
  );
}

export function TooltipStateExamples({ ctx }: ExampleProps): ReactElement {
  const [example, setExample] = useState('focus');
  const unavailable = example === 'unavailable';
  const selected = example === 'selected';
  return (
    <div className="hint-study-stack">
      <div className="hint-study-controls">
        <label>
          Source state
          <select value={example} onChange={(event) => setExample(event.currentTarget.value)}>
            <option value="focus">Keyboard focus</option>
            <option value="selected">Selected</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
      </div>
      <OverlayExampleFrame ctx={ctx} title="Tooltip source states" height={142}>
        <div className="hint-study-anchor" data-position="bottom-center">
          <Tooltip
            {...ctx.subject}
            key={example}
            label={unavailable ? 'Publish' : selected ? 'Remove from saved' : 'Preferences'}
            defaultOpen={selected}
          >
            <IconButton
              icon={unavailable ? ArrowSquareOutIcon : selected ? StarIcon : GearIcon}
              aria-label={unavailable ? 'Publish' : selected ? 'Remove from saved' : 'Preferences'}
              {...(selected ? { pressed: true } : {})}
              disabled={unavailable}
              size="s"
            />
          </Tooltip>
          {unavailable && (
            <Text size="body-s" color="secondary">
              Only editors can publish.
            </Text>
          )}
        </div>
      </OverlayExampleFrame>
    </div>
  );
}

export function TooltipOverflowExamples({ ctx }: ExampleProps): ReactElement {
  return (
    <div className="hint-study-stack">
      <OverlayExampleFrame ctx={ctx} title="Long tooltip and whole shortcut" height={184}>
        <div className="hint-study-anchor" data-position="bottom-center">
          <Tooltip
            {...ctx.subject}
            label="Search across all documents in this workspace"
            style={{ inlineSize: '13rem' }}
            shortcut={
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>F</Kbd>
              </KbdGroup>
            }
            defaultOpen
          >
            <IconButton icon={MagnifyingGlassIcon} aria-label="Search" size="s" />
          </Tooltip>
        </div>
      </OverlayExampleFrame>
      <div className="hint-study-row">
        <Tooltip label="replica-eu-central-production-archive-2026">
          <Button variant="ghost" tone="neutral" size="s">
            Full identifier
          </Button>
        </Tooltip>
        <Tooltip label="" shortcut="⌘K">
          <Button variant="ghost" tone="neutral" size="s">
            Empty label
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

export function TooltipLiveExamples({ ctx }: ExampleProps): ReactElement {
  const [action, setAction] = useState('');
  const [saved, setSaved] = useState(false);
  const saveLabel = saved ? 'Remove from saved' : 'Save document';
  return (
    <div className="hint-study-stack">
      <TooltipProvider>
        <div className="hint-study-row">
          <Tooltip {...ctx.subject} label="Search" shortcut="⌘K">
            <IconButton
              icon={MagnifyingGlassIcon}
              aria-label="Search"
              variant="ghost"
              onClick={() => setAction('Search activated.')}
            />
          </Tooltip>
          <Tooltip label="Preferences" shortcut="⌘,">
            <IconButton
              icon={GearIcon}
              aria-label="Preferences"
              variant="ghost"
              onClick={() => setAction('Preferences activated.')}
            />
          </Tooltip>
          <Tooltip label={saveLabel}>
            <IconButton
              icon={StarIcon}
              aria-label={saveLabel}
              variant="ghost"
              pressed={saved}
              onPressedChange={(next) => {
                setSaved(next);
                setAction(next ? 'Document saved.' : 'Removed from saved.');
              }}
            />
          </Tooltip>
        </div>
      </TooltipProvider>
      <Text size="body-s" color="secondary" role="status">
        {action}
      </Text>
    </div>
  );
}

export function TooltipPlacementExamples({ ctx }: ExampleProps): ReactElement {
  return (
    <OverlayPlacementStudy
      ctx={ctx}
      title="Tooltip placement"
      height={244}
      initialSide="top"
      initialAlign="center"
    >
      {(side, align) => (
        <Tooltip
          {...ctx.subject}
          side={side}
          align={align}
          label="Preferences"
          shortcut="⌘,"
          defaultOpen
        >
          <IconButton icon={GearIcon} aria-label="Preferences" />
        </Tooltip>
      )}
    </OverlayPlacementStudy>
  );
}

export function TooltipNestedExample({ ctx }: ExampleProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Release notes');
  return (
    <OverlayExampleFrame ctx={ctx} title="Tooltip inside a settings popover" height={332}>
      <div className="hint-study-anchor" data-position="top-start">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="s">Page settings</Button>
          </PopoverTrigger>
          <PopoverContent size="s" align="start">
            <PopoverHeader>
              <PopoverTitle>Page settings</PopoverTitle>
              <PopoverClose aria-label="Close page settings" />
            </PopoverHeader>
            <PopoverBody className="hint-study-row">
              <Input
                aria-label="Page name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                size="s"
              />
              <Tooltip {...ctx.subject} label="Restore default settings">
                <IconButton
                  icon={ArrowCounterClockwiseIcon}
                  aria-label="Restore default settings"
                  variant="ghost"
                  size="s"
                  onClick={() => setName('Release notes')}
                />
              </Tooltip>
            </PopoverBody>
            <PopoverFooter>
              <Button size="s" variant="secondary" tone="accent" onClick={() => setOpen(false)}>
                Done
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </div>
    </OverlayExampleFrame>
  );
}

export function TooltipContextExamples({ ctx }: ExampleProps): ReactElement {
  return (
    <OverlayExampleFrame ctx={ctx} title="Tooltip on a Preferences link" height={166}>
      <div className="hint-study-anchor" data-position="center-start">
        <Tooltip
          {...ctx.subject}
          label="Preferences & shortcuts"
          shortcut="⌘,"
          side="end"
          defaultOpen
        >
          <Link href="?item=09-user-preferences" target="_top" tone="neutral">
            <GearIcon size="1em" aria-hidden="true" /> Preferences
          </Link>
        </Tooltip>
      </div>
    </OverlayExampleFrame>
  );
}
