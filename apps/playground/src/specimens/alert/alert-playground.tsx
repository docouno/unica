import {
  Alert,
  AlertActions,
  AlertClose,
  AlertDescription,
  AlertTitle,
  Button,
  Stack,
} from '@docouno/unica';
import type { GlyphComponent } from '@docouno/unica';
import type { ReactElement } from 'react';
import { LightbulbIcon } from '@phosphor-icons/react';
import type { PreviewContext } from '../../workbench/types.js';
import { noticeOptions } from './alert-code.js';
import type { AlertValues } from './alert.spec.js';
import { useReviewNotice } from './use-review-notice.js';

interface PlaygroundProps {
  readonly values: AlertValues;
  readonly ctx: PreviewContext;
}

const EditorialGlyph: GlyphComponent = (props) => <LightbulbIcon {...props} weight="fill" />;

function ReviewNotice({ values, ctx }: PlaygroundProps): ReactElement {
  const { shown, publication, focusId, toggleFrom, publish } = useReviewNotice();
  const { action, dynamic, role, closeName } = noticeOptions(values);
  if (!shown) {
    return (
      <Button
        id={focusId}
        variant="secondary"
        tone="accent"
        onClick={(event) => toggleFrom(event.currentTarget)}
      >
        Restore alert
      </Button>
    );
  }
  return (
    <Stack gap={8}>
      <Alert
        {...ctx.subject}
        key={publication}
        size={values.size}
        status={values.status}
        role={dynamic && publication === 0 ? 'none' : role}
        aria-label={role === 'region' ? values['aria-label'].trim() : undefined}
        icon={
          values.icon === 'editorial' ? EditorialGlyph : values.icon === 'none' ? false : undefined
        }
        close={
          closeName ? (
            <AlertClose
              id={focusId}
              aria-label={closeName}
              onClose={(event) => {
                ctx.action('onClose')(event);
                toggleFrom(event.currentTarget);
              }}
            />
          ) : undefined
        }
      >
        {values.title.trim() && (
          <AlertTitle as={values.as}>
            <bdi>{values.title}</bdi>
          </AlertTitle>
        )}
        {values.description.trim() && (
          <AlertDescription>
            <bdi>{values.description}</bdi>
          </AlertDescription>
        )}
        {action && (
          <AlertActions>
            <Button
              id={closeName ? undefined : focusId}
              variant="secondary"
              tone="neutral"
              size="s"
              onClick={(event) => toggleFrom(event.currentTarget)}
            >
              <bdi>{values.actionLabel}</bdi>
            </Button>
          </AlertActions>
        )}
      </Alert>
      {dynamic && ctx.tab === 'playground' && (
        <div>
          <Button size="s" variant="ghost" tone="neutral" onClick={publish}>
            Show feedback
          </Button>
        </div>
      )}
    </Stack>
  );
}

export function AlertPlayground({ values, ctx }: PlaygroundProps): ReactElement {
  const matrix = ctx.tab === 'states';
  return (
    <div
      data-alert-comparison={matrix ? '' : undefined}
      style={{ inlineSize: matrix ? '16rem' : 'min(100%, 28rem)', maxInlineSize: '100%' }}
    >
      <ReviewNotice key={JSON.stringify(values)} ctx={ctx} values={values} />
    </div>
  );
}
