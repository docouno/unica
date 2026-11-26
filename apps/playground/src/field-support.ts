import type { FormFieldContextValue } from '@docouno/unica';

export function joinIds(...ids: readonly (string | undefined | false)[]): string | undefined {
  return (
    [...new Set(ids.flatMap((id) => (id ? id.trim().split(/\s+/).filter(Boolean) : [])))].join(
      ' ',
    ) || undefined
  );
}

export function fieldSupport(
  field: FormFieldContextValue | null,
  disabled: boolean | undefined,
  ...author: readonly (string | undefined | false)[]
): string | undefined {
  return joinIds(...author, field?.descriptionId, !disabled && field?.messageId, field?.counterId);
}
