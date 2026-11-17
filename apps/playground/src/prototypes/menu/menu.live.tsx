import type { ReactElement } from 'react';
import { useLiveMenu } from './use-live-menu.js';
import type { LiveMenuProps } from './use-live-menu.js';

export function Menu({ trigger, ...props }: LiveMenuProps): ReactElement {
  const menu = useLiveMenu(props);
  return (
    <>
      {trigger(menu.triggerProps)}
      {menu.panel}
    </>
  );
}
