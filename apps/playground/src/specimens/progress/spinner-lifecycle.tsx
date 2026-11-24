import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { CheckIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Flex, Icon, Spinner, Text } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewContext, PreviewProps, StoryContext } from '../../workbench/types.js';

const requests = [
  { id: 'save', duration: 2200, result: 'saved' },
  { id: 'quick', duration: 80, result: 'saved' },
  { id: 'fail', duration: 1400, result: 'failed' },
] as const;

const messages = {
  ready: 'Ready to save',
  pending: 'Saving changes…',
  saved: 'Changes saved',
  failed: 'Could not save changes. Try again.',
};

// A theme opened during a request joins the same save and reveal deadlines.
const startedByFrame = new WeakMap<StoryContext['onAction'], number>();

function SaveResult({
  request,
  started,
  subject,
}: {
  readonly request: (typeof requests)[number] | undefined;
  readonly started: number;
  readonly subject: PreviewContext['subject'];
}): ReactElement {
  const [elapsedAtMount] = useState(() => Math.max(0, performance.now() - started));
  const [finished, setFinished] = useState(() => !request || elapsedAtMount >= request.duration);
  useEffect(() => {
    if (request && !finished) {
      const timer = window.setTimeout(
        () => setFinished(true),
        Math.max(0, started + request.duration - performance.now()),
      );
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [finished, request, started]);

  const phase = request ? (finished ? request.result : 'pending') : 'ready';
  return (
    <>
      <span aria-busy={phase === 'pending'} className="activity-reserved">
        {phase === 'pending' && (
          <Spinner {...subject} size="m" tone="muted" delay={Math.max(0, 150 - elapsedAtMount)} />
        )}
        {phase === 'saved' && <Icon usage="slot" icon={CheckIcon} size="m" color="muted" />}
        {phase === 'failed' && (
          <Icon usage="slot" icon={WarningCircleIcon} size="m" color="danger" />
        )}
      </span>
      <Text as="span" size="body-s">
        <bdi>{messages[phase]}</bdi>
      </Text>
    </>
  );
}

export function SpinnerLifecycleExample({ ctx }: PreviewProps): ReactElement {
  const story = ctx.story;
  useStoryAction(ctx, () => {
    if (story) {
      startedByFrame.set(story.onAction, performance.now());
    }
  });
  const action = story?.lastAction;
  const request = requests.find(({ id }) => id === action?.id);
  return (
    <Flex
      align="center"
      gap={8}
      role={ctx.comparing ? undefined : 'status'}
      style={{ inlineSize: '100%' }}
    >
      <SaveResult
        key={action?.seq ?? 0}
        request={request}
        started={story ? (startedByFrame.get(story.onAction) ?? 0) : 0}
        subject={ctx.subject}
      />
    </Flex>
  );
}
