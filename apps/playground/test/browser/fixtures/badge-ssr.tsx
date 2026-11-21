import { Badge } from '@docouno/unica';
import { InfoIcon } from '@phosphor-icons/react';
import { useState } from 'react';

export default function ServerBadges() {
  const [details, setDetails] = useState(false);
  return (
    <>
      <Badge size="s" status="accent" data-testid="server-label">
        Version <bdi dir="ltr">99+</bdi>
      </Badge>
      <Badge asChild status="info" iconLeft={InfoIcon}>
        <button onClick={() => setDetails(true)} aria-expanded={details}>
          About this release
        </button>
      </Badge>
    </>
  );
}
