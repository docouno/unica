import { useId } from 'react';
import { Select, Stack, Text } from '@docouno/unica';
import type { SelectProps } from '@docouno/unica';
import type { ReactNode } from 'react';

type ExampleFieldProps = SelectProps & {
  readonly label: string;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
};

export function SelectFieldExample({
  label,
  description,
  message,
  id,
  'aria-describedby': describedBy,
  ...props
}: ExampleFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = `${controlId}-description`;
  const messageId = `${controlId}-message`;
  const visibleMessage = props.disabled ? undefined : message;
  const descriptionRefs = [
    describedBy,
    description ? descriptionId : undefined,
    visibleMessage ? messageId : undefined,
  ].filter(Boolean);

  return (
    <Stack gap={4} style={{ minInlineSize: 0 }}>
      <Text as="label" htmlFor={controlId} size="body-s" weight="medium">
        {label}
        {props.required && !props.disabled && !props.readOnly && <span aria-hidden="true"> *</span>}
      </Text>
      <Select {...props} id={controlId} aria-describedby={descriptionRefs.join(' ') || undefined} />
      {description && (
        <Text id={descriptionId} size="caption-l" color="secondary">
          {description}
        </Text>
      )}
      {visibleMessage && (
        <Text
          id={messageId}
          size="caption-l"
          color={props.status && props.status !== 'neutral' ? props.status : 'secondary'}
        >
          {visibleMessage}
        </Text>
      )}
    </Stack>
  );
}
