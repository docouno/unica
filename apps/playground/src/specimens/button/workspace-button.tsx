import { Button } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function WorkspaceButton({ href = '/workspace', buttonProps = {} } = {}) {
  return (
    <Button {...buttonProps} asChild>
      <a href={href}>Open workspace</a>
    </Button>
  );
}
