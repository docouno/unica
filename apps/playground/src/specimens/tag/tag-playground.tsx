import { Button } from '@docouno/unica';
import { TagIcon } from '@phosphor-icons/react';
import type { KeyboardEvent, ReactElement } from 'react';
import { Tag } from '../../prototypes/tag/tag.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { tagLabel } from './tag-code.js';
import type { TagValues } from './tag.spec.js';
import { useTagRemoval } from './use-tag-removal.js';

function preventRepeatedActivation(event: KeyboardEvent<HTMLElement>): void {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
  }
}

export function TagPlayground({
  ctx,
  values,
}: PreviewProps & { readonly values: TagValues }): ReactElement {
  const { id, removed, toggle } = useTagRemoval();
  const label = tagLabel(values.label);
  if (removed) {
    return (
      <Button
        id={id}
        type="button"
        size="s"
        variant="secondary"
        tone="neutral"
        onKeyDown={preventRepeatedActivation}
        onClick={toggle}
      >
        Restore tag
      </Button>
    );
  }
  return (
    <Tag
      {...ctx.subject}
      id={id}
      size={values.size}
      status={values.status}
      {...(values.iconLeft === 'tag' ? { iconLeft: TagIcon } : {})}
      disabled={values.disabled}
      pending={values.pending}
      tabIndex={values.disabled ? -1 : undefined}
      removeLabel={`Remove ${label}`}
      onKeyDown={preventRepeatedActivation}
      onRemove={() => {
        toggle();
        ctx.action('onRemove')(label);
      }}
    >
      {label}
    </Tag>
  );
}
