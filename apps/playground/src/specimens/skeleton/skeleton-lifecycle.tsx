import { useId, useLayoutEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { FileTextIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Button, Card, CardFooter, Icon, Text, Title } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps, StoryContext } from '../../workbench/types.js';
import { skeletonPhases } from './skeleton.controls.js';
import type { SkeletonPhase } from './skeleton.controls.js';
import { DocumentRows } from './skeleton.examples.js';

type RequestAction = 'retry' | 'refresh';

const messages: Record<SkeletonPhase, string> = {
  initial: 'Loading documents…',
  delay: 'Loading documents…',
  partial: 'Loading remaining documents…',
  slow: 'Still loading. This is taking longer than usual.',
  ready: '3 documents loaded.',
  refresh: 'Updating documents. Showing the last available version.',
  empty: 'No documents found.',
  error: 'Documents could not be loaded.',
};

const replay = [
  { at: 0, phase: 'delay' },
  { at: 200, phase: 'initial' },
  { at: 1100, phase: 'partial' },
  { at: 2200, phase: 'ready' },
] as const;
const fast = [replay[0], { at: 100, phase: 'ready' }] as const;
const refresh = [
  { at: 0, phase: 'refresh' },
  { at: 1100, phase: 'ready' },
] as const;

interface Playback {
  readonly steps: readonly { readonly at: number; readonly phase: SkeletonPhase }[];
  readonly started: number;
  readonly index: number;
}

interface LocalRequest extends Playback {
  readonly selection: SkeletonPhase;
  readonly action: RequestAction;
}

// The toolbar keeps its timeline when a theme is hidden or expanded. Only mounted
// previews schedule a tick, and the first tick to claim a step advances the frame.
interface FrameRequest extends Playback {
  readonly revision: number;
  readonly initiator?: { readonly id: string; readonly action: RequestAction };
}

const sharedReplays = new WeakMap<StoryContext['setControl'], FrameRequest>();

function nextStep(
  run: Playback,
  advance: (phase: SkeletonPhase) => void,
): (() => void) | undefined {
  const next = run.steps[run.index + 1];
  if (!next) {
    return;
  }
  const remaining = Math.max(0, run.started + next.at - performance.now());
  const timer = setTimeout(() => advance(next.phase), remaining);
  return () => clearTimeout(timer);
}

export function SkeletonLifecycleExample({ ctx }: PreviewProps): ReactElement {
  const titleId = useId();
  const story = ctx.story;
  const selected =
    skeletonPhases.find(({ value }) => value === story?.controls.phase)?.value ?? 'initial';
  const setControl = story?.setControl;
  const revision = story?.revision;
  const lastAction = story?.lastAction;
  const [local, setLocal] = useState<LocalRequest | null>(null);

  if (local && local.selection !== selected) {
    setLocal(null);
  }

  useLayoutEffect(() => {
    if (local) {
      return nextStep(local, () => setLocal({ ...local, index: local.index + 1 }));
    }
    if (!setControl) {
      return;
    }
    const run = sharedReplays.get(setControl);
    if (!run) {
      return;
    }
    if (run.revision !== revision || run.steps[run.index]?.phase !== selected) {
      sharedReplays.delete(setControl);
      return;
    }
    return nextStep(run, (phase) => {
      if (sharedReplays.get(setControl) !== run) {
        return;
      }
      sharedReplays.set(setControl, { ...run, index: run.index + 1 });
      setControl('phase', phase);
    });
  }, [lastAction, local, revision, selected, setControl]);

  function startFrame(
    steps: typeof replay | typeof fast | typeof refresh,
    action?: RequestAction,
  ): void {
    if (!story) {
      return;
    }
    setLocal(null);
    sharedReplays.set(story.setControl, {
      steps,
      started: performance.now(),
      index: 0,
      revision: story.revision,
      ...(action ? { initiator: { id: ctx.id, action } } : {}),
    });
    story.setControl('phase', steps[0].phase);
  }

  useStoryAction(ctx, (id) => {
    if (id === 'replay' || id === 'fast') {
      startFrame(id === 'fast' ? fast : replay);
    }
  });

  function start(action: RequestAction): void {
    const steps = action === 'retry' ? replay : refresh;
    if (!ctx.comparing && story) {
      startFrame(steps, action);
    } else {
      setLocal({ steps, started: performance.now(), index: 0, action, selection: selected });
    }
  }

  const frame = setControl && sharedReplays.get(setControl);
  const initiator =
    frame?.revision === revision && frame?.steps[frame.index]?.phase === selected
      ? frame.initiator
      : undefined;
  const action = local?.action ?? (initiator?.id === ctx.id ? initiator.action : undefined);
  const state = local?.steps[local.index]?.phase ?? selected;
  const pending = state !== 'ready' && action;
  const busy = state !== 'ready' && state !== 'empty' && state !== 'error';
  const ready = state === 'ready' || state === 'refresh' ? 3 : state === 'partial' ? 1 : 0;
  const retry = state === 'slow' || state === 'error' || pending === 'retry';

  return (
    <Card className="skeleton-demo-lifecycle">
      <Title as="h3" size="heading-s" id={titleId}>
        Recent documents
      </Title>
      <div
        role="region"
        aria-labelledby={titleId}
        aria-busy={busy}
        className="skeleton-demo-region"
        data-load-state={state}
        data-skeleton-demo-static={state === 'slow' || undefined}
      >
        {state === 'empty' || state === 'error' ? (
          <div className="skeleton-demo-terminal">
            <Icon
              usage="slot"
              icon={state === 'error' ? WarningCircleIcon : FileTextIcon}
              size="l"
            />
            <Text size="body-s" weight="medium">
              {state === 'error' ? 'Couldn’t load documents' : 'No documents yet'}
            </Text>
            <Text size="caption-l" color="muted">
              <bdi>
                {state === 'error'
                  ? 'Check your connection and try again.'
                  : 'New documents will appear here.'}
              </bdi>
            </Text>
          </div>
        ) : state === 'delay' ? null : (
          <DocumentRows ready={ready} subject={ctx.subject} />
        )}
      </div>
      <div className="skeleton-demo-status-slot">
        <Text
          size="caption-l"
          color="muted"
          role="status"
          aria-live={ctx.comparing && !action ? 'off' : 'polite'}
          aria-atomic="true"
        >
          <bdi>{messages[state]}</bdi>
        </Text>
      </div>
      <CardFooter withBorder justify="start">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={!pending && !retry && state !== 'ready'}
          loading={Boolean(pending)}
          onClick={() => start(retry ? 'retry' : 'refresh')}
        >
          {retry ? 'Try again' : 'Refresh'}
        </Button>
      </CardFooter>
    </Card>
  );
}
