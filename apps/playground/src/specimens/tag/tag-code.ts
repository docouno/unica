import { previewProps, previewText } from '../preview-code.js';
import type { TagValues } from './tag.spec.js';
import removalSource from './use-tag-removal.ts?raw';

export function tagLabel(value: string): string {
  return value.trim() ? value : 'Label';
}

export function tagCode(values: TagValues): string {
  const label = tagLabel(values.label);
  const props = previewProps(
    {
      size: values.size,
      status: values.status,
      disabled: values.disabled,
      pending: values.pending,
    },
    { size: 'm', status: 'neutral', disabled: false, pending: false },
  );
  const hasIcon = values.iconLeft === 'tag';
  const iconImport = hasIcon ? "import { TagIcon } from '@phosphor-icons/react';\n" : '';
  const keyHandler = `onKeyDown={(event) => {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
  }}`;
  return `import { Button } from '@docouno/unica';
${iconImport}import { Tag } from './prototypes/tag/tag.proto.js';
${removalSource}
export function AssignedTag() {
  const { id, removed, toggle } = useTagRemoval();
  if (removed) {
    return (
      <Button id={id} type="button" size="s" variant="secondary" tone="neutral" ${keyHandler} onClick={toggle}>
        Restore tag
      </Button>
    );
  }
  return (
    <Tag id={id}${props}${hasIcon ? ' iconLeft={TagIcon}' : ''}${values.disabled ? ' tabIndex={-1}' : ''} removeLabel=${previewText(`Remove ${label}`)} ${keyHandler} onRemove={toggle}>
      ${previewText(label)}
    </Tag>
  );
}`;
}
