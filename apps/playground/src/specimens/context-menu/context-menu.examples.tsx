import type { PreviewProps } from '../../workbench/types.js';
import { InvoiceActions } from './invoice-actions.js';

export function Invocations({
  ctx,
  touch,
}: PreviewProps & { readonly touch?: boolean | undefined }) {
  return (
    <div className="context-study-live">
      <InvoiceActions
        contentProps={ctx.subject}
        targetProps={ctx.subject}
        triggerLabel="Actions for Invoice draft"
        longPress={touch}
      />
    </div>
  );
}
