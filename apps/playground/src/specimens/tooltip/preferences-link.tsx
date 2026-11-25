import { Link, Tooltip } from '@docouno/unica';
import { GearIcon } from '@phosphor-icons/react';
import '@docouno/unica/styles.css';

export function PreferencesLink({ href = '/preferences', linkProps = {}, subject = {} } = {}) {
  return (
    <nav aria-label="Settings navigation">
      <Tooltip {...subject} label="Preferences & shortcuts" shortcut="⌘," side="end" defaultOpen>
        <Link {...subject} {...linkProps} href={href} tone="neutral">
          <GearIcon size="1em" aria-hidden="true" /> Preferences
        </Link>
      </Tooltip>
    </nav>
  );
}
