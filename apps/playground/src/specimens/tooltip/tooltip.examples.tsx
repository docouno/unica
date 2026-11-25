import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  Flex,
  IconButton,
  Input,
  Kbd,
  KbdGroup,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Stack,
  Text,
  Tooltip,
  TooltipProvider,
} from '@docouno/unica';
import {
  ArrowCounterClockwiseIcon,
  ArrowSquareOutIcon,
  GearIcon,
  MagnifyingGlassIcon,
  SidebarSimpleIcon,
  StarIcon,
} from '@phosphor-icons/react';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import { placementAlignments, placementSides } from '../../examples/overlay-placement-options.js';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { PreferencesLink } from './preferences-link.js';
import '../../examples/overlay-studies.css';

function Frame({
  ctx,
  title,
  height,
  position = 'bottom-center',
  sourceSurface = false,
  children,
}: PreviewProps & {
  title: string;
  height: number;
  position?: string;
  sourceSurface?: boolean;
  children: ReactNode;
}) {
  return (
    <OverlayExampleFrame ctx={ctx} title={title} height={height}>
      <div className="hint-study-anchor" data-position={position}>
        {sourceSurface ? (
          <div>
            <ExampleSurface surface={ctx.surface}>{children}</ExampleSurface>
          </div>
        ) : (
          children
        )}
      </div>
    </OverlayExampleFrame>
  );
}

export function TooltipContentExamples({ ctx }: PreviewProps) {
  const content = ctx.story?.controls.content ?? 'shortcut';
  const [pinned, setPinned] = useState(false);
  const action = pinned ? 'Unpin inspector' : 'Pin inspector';
  return (
    <Frame ctx={ctx} title="Tooltip content example" height={184}>
      <Tooltip
        {...ctx.subject}
        key={String(content)}
        label={
          content === 'description'
            ? 'Keep this panel visible while you browse other documents.'
            : action
        }
        describe={content === 'description'}
        shortcut={content === 'shortcut' ? '⌘I' : undefined}
        defaultOpen
      >
        <IconButton
          {...ctx.subject}
          icon={SidebarSimpleIcon}
          aria-label="Pin inspector"
          size="s"
          pressed={pinned}
          onPressedChange={setPinned}
        />
      </Tooltip>
    </Frame>
  );
}

function SourceState({ ctx, mode }: PreviewProps & { mode: string }) {
  const [saved, setSaved] = useState(true);
  const [message, setMessage] = useState('');
  const reasonId = useId();
  const unavailable = mode === 'unavailable';
  const toggle = mode === 'selected';
  const label = unavailable
    ? 'Publish'
    : toggle
      ? saved
        ? 'Remove from saved'
        : 'Save document'
      : 'Preferences';
  return (
    <Stack align="center" gap={4}>
      <Tooltip {...ctx.subject} label={label} defaultOpen={toggle}>
        <IconButton
          {...ctx.subject}
          icon={unavailable ? ArrowSquareOutIcon : toggle ? StarIcon : GearIcon}
          aria-label={toggle ? 'Save document' : label}
          aria-describedby={unavailable ? reasonId : undefined}
          disabled={unavailable}
          size="s"
          {...(toggle
            ? { pressed: saved, onPressedChange: setSaved }
            : { onClick: () => setMessage('Preferences requested.') })}
        />
      </Tooltip>
      {unavailable && (
        <Text size="body-s" color="secondary" id={reasonId} dir="auto">
          Only editors can publish.
        </Text>
      )}
      {message && (
        <Text size="body-s" color="secondary" dir="auto" role="status">
          {message}
        </Text>
      )}
    </Stack>
  );
}

export function TooltipStateExamples({ ctx }: PreviewProps) {
  const mode = String(ctx.story?.controls.source ?? 'focus');
  return (
    <Frame ctx={ctx} title="Tooltip source states" height={178} sourceSurface>
      <SourceState key={mode} ctx={ctx} mode={mode} />
    </Frame>
  );
}

const identifier = 'replica-eu-central-production-archive-2026';

export function TooltipOverflowExamples({ ctx }: PreviewProps) {
  const [result, setResult] = useState('');
  return (
    <Stack gap={12} style={{ inlineSize: '100%' }}>
      <Frame ctx={ctx} title="Long tooltip and whole shortcut" height={232}>
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
          <IconButton
            {...ctx.subject}
            icon={MagnifyingGlassIcon}
            aria-label="Search"
            size="s"
            onClick={() => setResult('Search requested.')}
          />
        </Tooltip>
      </Frame>
      <Flex wrap="wrap" align="center" gap={12}>
        <Tooltip {...ctx.subject} label={identifier}>
          <Button
            {...ctx.subject}
            variant="ghost"
            tone="neutral"
            size="s"
            onClick={() => setResult(identifier)}
          >
            Full identifier
          </Button>
        </Tooltip>
        <Tooltip {...ctx.subject} label="" shortcut="⌘K">
          <Button
            {...ctx.subject}
            variant="ghost"
            tone="neutral"
            size="s"
            onClick={() => setResult('Empty label activated.')}
          >
            Empty label
          </Button>
        </Tooltip>
      </Flex>
      <Text
        role="status"
        dir="auto"
        size="body-s"
        color="secondary"
        style={{ overflowWrap: 'anywhere' }}
      >
        {result}
      </Text>
    </Stack>
  );
}

export function TooltipLiveExamples({ ctx }: PreviewProps) {
  const [action, setAction] = useState('');
  const [saved, setSaved] = useState(false);
  const saveLabel = saved ? 'Remove from saved' : 'Save document';
  return (
    <Stack gap={8} align="start">
      <TooltipProvider>
        <Flex wrap="wrap" align="center" gap={12}>
          <Tooltip {...ctx.subject} label="Search" shortcut="⌘K">
            <IconButton
              {...ctx.subject}
              icon={MagnifyingGlassIcon}
              aria-label="Search"
              variant="ghost"
              onClick={() => setAction('Search requested.')}
            />
          </Tooltip>
          <Tooltip {...ctx.subject} label="Preferences" shortcut="⌘,">
            <IconButton
              {...ctx.subject}
              icon={GearIcon}
              aria-label="Preferences"
              variant="ghost"
              onClick={() => setAction('Preferences requested.')}
            />
          </Tooltip>
          <Tooltip {...ctx.subject} label={saveLabel}>
            <IconButton
              {...ctx.subject}
              icon={StarIcon}
              aria-label="Save document"
              variant="ghost"
              pressed={saved}
              onPressedChange={(next) => {
                setSaved(next);
                setAction(next ? 'Document saved.' : 'Removed from saved.');
              }}
            />
          </Tooltip>
        </Flex>
      </TooltipProvider>
      <Text size="body-s" color="secondary" role="status" dir="auto">
        {action}
      </Text>
    </Stack>
  );
}

export function TooltipPlacementExamples({ ctx }: PreviewProps) {
  const controls = ctx.story?.controls;
  const side = placementSides.find((value) => value === controls?.side) ?? 'top';
  const align = placementAlignments.find((value) => value === controls?.align) ?? 'center';
  const position = String(controls?.position ?? 'center');
  const [requested, setRequested] = useState(false);
  return (
    <Frame ctx={ctx} title="Tooltip placement" height={244} position={position}>
      <Tooltip
        {...ctx.subject}
        key={`${side}-${align}-${position}`}
        side={side}
        align={align}
        label="Preferences"
        shortcut="⌘,"
        defaultOpen
      >
        <IconButton
          {...ctx.subject}
          icon={GearIcon}
          aria-label="Preferences"
          onClick={() => setRequested(true)}
        />
      </Tooltip>
      {requested && (
        <div>
          <ExampleSurface surface={ctx.surface}>
            <Text size="body-s" color="secondary" role="status" dir="auto">
              Preferences requested.
            </Text>
          </ExampleSurface>
        </div>
      )}
    </Frame>
  );
}

export function TooltipNestedExample({ ctx }: PreviewProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Release notes');
  return (
    <Frame ctx={ctx} title="Tooltip inside a settings popover" height={332} position="top-start">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button {...ctx.subject} size="s">
            Page settings
          </Button>
        </PopoverTrigger>
        <PopoverContent size="s" align="start">
          <PopoverHeader>
            <PopoverTitle>Page settings</PopoverTitle>
            <PopoverClose aria-label="Close page settings" />
          </PopoverHeader>
          <PopoverBody>
            <Flex gap={8} align="center">
              <Input
                aria-label="Page name"
                dir="auto"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                size="s"
              />
              <Tooltip {...ctx.subject} label="Restore default settings">
                <IconButton
                  {...ctx.subject}
                  icon={ArrowCounterClockwiseIcon}
                  aria-label="Restore default settings"
                  variant="ghost"
                  size="s"
                  onClick={() => setName('Release notes')}
                />
              </Tooltip>
            </Flex>
          </PopoverBody>
          <PopoverFooter>
            <Button size="s" variant="secondary" tone="accent" onClick={() => setOpen(false)}>
              Done
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </Frame>
  );
}

export function TooltipContextExamples({ ctx }: PreviewProps) {
  return (
    <Frame
      ctx={ctx}
      title="Tooltip on a Preferences link"
      height={184}
      position="center-start"
      sourceSurface
    >
      <PreferencesLink
        href="?item=09-user-preferences"
        linkProps={{ target: '_top' }}
        subject={ctx.subject}
      />
    </Frame>
  );
}
