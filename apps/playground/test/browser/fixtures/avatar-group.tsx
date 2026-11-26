import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { Avatar, AvatarGroup, Button } from '@docouno/unica';
import type { AvatarGroupProps } from '@docouno/unica';

const reviewers = [
  { id: 'alex', name: 'Alex Rivera', src: '/assets/avatar-person-light.png' },
  { id: 'blank', name: ' ' },
  { id: 'sam', name: 'Sam Chen' },
  { id: 'jo', name: 'Jo Martin', src: '/avatar-test/hidden-member.svg' },
] as const;

export default function AvatarGroupFixture(): ReactElement {
  const [members, setMembers] = useState<AvatarGroupProps['members']>(reviewers);
  const [max, setMax] = useState(3);
  const [showNames, setShowNames] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [inert, setInert] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  function reverseReviewers(): void {
    setMembers([reviewers[2], reviewers[1], reviewers[0], reviewers[3]]);
  }

  function reverseAndEscape(): void {
    flushSync(reverseReviewers);
    queueMicrotask(() => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
    });
  }

  return (
    <div style={{ margin: '80px 24px 0', maxInlineSize: '320px' }}>
      <form>
        <button type="button">Before reviewers</button>
        <fieldset disabled style={{ border: 0, padding: 0, margin: '16px 0' }}>
          <AvatarGroup
            label="Reviewers"
            members={members}
            max={max}
            showNames={showNames}
            hidden={hidden}
            inert={inert}
            getOverflowLabel={(count) => `${String(count)} más`}
            data-testid="reviewers"
          />
        </fieldset>
        <Button type="submit">
          <Avatar alt="" name="Alex Rivera" size="2xs" />
          Submit review
        </Button>
      </form>
      <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={reverseReviewers}>
          Reverse reviewers
        </button>
        <button
          type="button"
          onClick={() => {
            document.querySelector<HTMLElement>('.unica-tooltip:popover-open')?.hidePopover();
            flushSync(() => setMembers((current) => [...current]));
          }}
        >
          Close active name hint and rerender
        </button>
        <button type="button" onClick={reverseAndEscape}>
          Reverse and dismiss reviewers
        </button>
        <button type="button" onClick={() => setMax(1)}>
          Show one
        </button>
        <button type="button" onClick={() => setShowNames((value) => !value)}>
          Toggle names
        </button>
        <button type="button" onClick={() => setHidden((value) => !value)}>
          Toggle hidden
        </button>
        <button type="button" onClick={() => setInert((value) => !value)}>
          Toggle inert
        </button>
        <button type="button" onClick={() => setMembers([])}>
          Clear reviewers
        </button>
        <button type="button" onClick={() => dialog.current?.showModal()}>
          Open contributors
        </button>
      </p>
      <dialog
        className="unica-overlay-surface"
        data-surface="overlay"
        aria-label="Contributors"
        ref={dialog}
      >
        <button type="button" autoFocus onClick={() => dialog.current?.close()}>
          Close contributors
        </button>
        <div style={{ padding: 16 }}>
          <AvatarGroup label="Contributors" members={members.slice(0, 3)} showNames size="s" />
        </div>
        <button type="button" onClick={reverseAndEscape}>
          Reverse and dismiss contributors
        </button>
      </dialog>
    </div>
  );
}
