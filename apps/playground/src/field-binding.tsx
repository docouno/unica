import type { ReactNode } from 'react';
import { useFormField } from '@docouno/unica';
import type { FormFieldContextValue } from '@docouno/unica';

export function FieldBinding({
  children,
}: {
  children: (field: FormFieldContextValue | null) => ReactNode;
}): ReactNode {
  return children(useFormField());
}
