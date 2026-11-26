import { Button, Tag } from '@docouno/unica';
import { MinusIcon, TagIcon } from '@phosphor-icons/react';
import type { KeyboardEvent, ReactElement } from 'react';
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
  const { action, removed, toggle } = useTagRemoval();
  const label = tagLabel(values.children);
  if (removed) {
    return (
      <Button
        ref={action}
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
      removeRef={action}
      size={values.size}
      status={values.status}
      {...(values.iconLeft === 'tag' ? { iconLeft: TagIcon } : {})}
      disabled={values.disabled}
      loading={values.loading}
      textValue={values.textValue.trim() || undefined}
      removeIcon={values.removeIcon === 'minus' ? MinusIcon : undefined}
      removeTabIndex={values.removeTabIndex === '-1' ? -1 : 0}
      removeLabel={values.removeLabel.trim() || `Remove ${label}`}
      onRemove={() => {
        toggle();
        ctx.action('onRemove')(label);
      }}
    >
      {label}
    </Tag>
  );
}
