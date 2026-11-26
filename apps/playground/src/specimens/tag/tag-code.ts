import { previewProps, previewText } from '../preview-code.js';
import type { TagValues } from './tag.spec.js';
import removalSource from './use-tag-removal.ts?raw';

export function tagLabel(value: string): string {
  return value.trim() ? value : 'Label';
}

export function tagCode(values: TagValues): string {
  const label = tagLabel(values.children);
  const props = previewProps(
    {
      size: values.size,
      status: values.status,
      disabled: values.disabled,
      loading: values.loading,
      textValue: values.textValue.trim(),
      removeTabIndex: Number(values.removeTabIndex),
    },
    {
      size: 'm',
      status: 'neutral',
      disabled: false,
      loading: false,
      textValue: '',
      removeTabIndex: 0,
    },
  );
  const icons = [
    values.iconLeft === 'tag' ? 'TagIcon' : undefined,
    values.removeIcon === 'minus' ? 'MinusIcon' : undefined,
  ].filter(Boolean);
  const iconImport = icons.length
    ? `import { ${icons.join(', ')} } from '@phosphor-icons/react';\n`
    : '';
  const iconProps =
    (values.iconLeft === 'tag' ? ' iconLeft={TagIcon}' : '') +
    (values.removeIcon === 'minus' ? ' removeIcon={MinusIcon}' : '');
  return `import { Button, Tag } from '@docouno/unica';
${iconImport}${removalSource.replace('useRef<HTMLButtonElement>', 'useRef')}
export function AssignedTag() {
  const { action, removed, toggle } = useTagRemoval();
  if (removed) {
    return (
      <Button ref={action} type="button" size="s" variant="secondary" tone="neutral" onKeyDown={(event) => {
        if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
      }} onClick={toggle}>
        Restore tag
      </Button>
    );
  }
  return (
    <Tag removeRef={action}${props}${iconProps} removeLabel=${previewText(values.removeLabel.trim() || `Remove ${label}`)} onRemove={toggle}>
      ${previewText(label)}
    </Tag>
  );
}`;
}
