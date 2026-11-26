import { StrictMode, useState } from 'react';
import type { ReactElement } from 'react';
import { Avatar } from '@docouno/unica';
import type { AvatarProps } from '@docouno/unica';

const portraitPath = '/avatar-test/';
const candidates = portraitPath + 'small.svg 40w, ' + portraitPath + 'large.svg 80w';
const portraits = {
  'Pending Alex': {
    alt: 'Alex Rivera',
    name: 'Alex Rivera',
    src: portraitPath + 'pending.svg',
  },
  'Sam with candidates': {
    alt: 'Sam Chen',
    name: 'Sam Chen',
    srcSet: portraitPath + 'sam.svg 1x',
  },
  'Ready Alex': {
    alt: 'Alex Rivera',
    name: 'Alex Rivera',
    src: portraitPath + 'alex-v1.svg',
    srcSet: portraitPath + 'alex-v1.svg 1x',
  },
  'New version': {
    alt: 'Sam Chen',
    name: 'Sam Chen',
    src: portraitPath + 'sam-v2.svg',
    srcSet: portraitPath + 'sam-v2.svg 1x',
  },
  Responsive: {
    alt: 'Jo Martin',
    name: 'Jo Martin',
    srcSet: candidates,
    sizes: '(max-width: 500px) 40px, 80px',
  },
  'Explicit sizes': {
    alt: 'Jo Martin',
    name: 'Jo Martin',
    srcSet: candidates,
    sizes: '80px',
  },
  'Broken portrait': {
    alt: 'Jo Martin',
    name: 'Jo Martin',
    src: portraitPath + 'retry.svg',
  },
  'Broken without name': {
    alt: 'Unassigned',
    src: portraitPath + 'invalid.svg',
  },
  'Remove source': { alt: 'Sam Chen', name: 'Sam Chen' },
} satisfies Record<string, AvatarProps>;

function PhotoChanges(): ReactElement {
  const [props, setProps] = useState<AvatarProps>({ alt: 'Unassigned' });
  const [attempt, setAttempt] = useState(0);
  const [hide, setHide] = useState(false);
  const [crop, setCrop] = useState(false);
  return (
    <>
      <div hidden={hide} data-testid="photo-slot">
        <Avatar
          {...props}
          key={attempt}
          data-testid="portrait"
          imagePosition={crop ? '30% 20%' : undefined}
        />
      </div>
      {Object.entries(portraits).map(([label, portrait]) => (
        <button key={label} type="button" onClick={() => setProps(portrait)}>
          {label}
        </button>
      ))}
      <button type="button" onClick={() => setAttempt((value) => value + 1)}>
        Retry
      </button>
      <button type="button" onClick={() => setHide((value) => !value)}>
        Toggle frame visibility
      </button>
      <button type="button" onClick={() => setCrop((value) => !value)}>
        Change crop
      </button>
    </>
  );
}

export default function AvatarImageFixture(): ReactElement {
  return (
    <StrictMode>
      <PhotoChanges />
    </StrictMode>
  );
}
