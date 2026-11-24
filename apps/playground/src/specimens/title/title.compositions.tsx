import { useId } from 'react';
import { Button, Divider, Stack, Text, Title } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import type { PreviewProps } from '../../workbench/types.js';

export function AuthExample({ ctx }: PreviewProps) {
  return (
    <ExampleSurface surface={ctx.surface}>
      <header style={{ maxInlineSize: '32.5rem' }}>
        <Stack gap={8}>
          <Title {...ctx.subject} textWrap="balance">
            <bdi>Sign in to your workspace</bdi>
          </Title>
          <Text color="secondary">
            <bdi>Use the work email address where you received your invitation.</bdi>
          </Text>
        </Stack>
      </header>
    </ExampleSurface>
  );
}

export const authCode = `import '@docouno/unica/styles.css';
import { Stack, Text, Title } from '@docouno/unica';

export function SignInIntroduction() {
  return (
    <header style={{ maxInlineSize: '32.5rem' }}>
      <Stack gap={8}>
        <Title textWrap="balance"><bdi>Sign in to your workspace</bdi></Title>
        <Text color="secondary">
          <bdi>Use the work email address where you received your invitation.</bdi>
        </Text>
      </Stack>
    </header>
  );
}`;

export function EditorExample({ ctx }: PreviewProps) {
  return (
    <ExampleSurface surface={ctx.surface}>
      <article style={{ maxInlineSize: '47.5rem' }}>
        <Stack gap={16}>
          <Title textWrap="balance">
            <bdi>Planning a release</bdi>
          </Title>
          <Text>
            <bdi>Record who owns the release and how to verify it.</bdi>
          </Text>
          <Stack gap={4}>
            <Title {...ctx.subject} as="h2" size="heading-m">
              <bdi>Acceptance checks</bdi>
            </Title>
            <Text>
              <bdi>Give each check an expected result and a reviewer.</bdi>
            </Text>
          </Stack>
        </Stack>
      </article>
    </ExampleSurface>
  );
}

export const editorCode = `import '@docouno/unica/styles.css';
import { Stack, Text, Title } from '@docouno/unica';

export function ReleaseBrief() {
  return (
    <article style={{ maxInlineSize: '47.5rem' }}>
      <Stack gap={16}>
        <Title textWrap="balance"><bdi>Planning a release</bdi></Title>
        <Text><bdi>Record who owns the release and how to verify it.</bdi></Text>
        <Stack gap={4}>
          <Title as="h2" size="heading-m"><bdi>Acceptance checks</bdi></Title>
          <Text><bdi>Give each check an expected result and a reviewer.</bdi></Text>
        </Stack>
      </Stack>
    </article>
  );
}`;

export function DrawerExample({ ctx }: PreviewProps) {
  const headingId = useId();

  return (
    <div style={{ inlineSize: 'min(100%, 32.5rem)' }}>
      <ExampleSurface surface={ctx.surface}>
        <aside aria-labelledby={headingId}>
          <Stack gap={12}>
            <Title {...ctx.subject} id={headingId} as="h2" size="heading-xl" textWrap="balance">
              <bdi>Release brief details</bdi>
            </Title>
            <Divider />
            <Text size="body-s">
              <bdi>Maintained by the release team.</bdi>
            </Text>
            <Text size="caption-l" color="secondary">
              <bdi>Review interval · Four weeks</bdi>
            </Text>
          </Stack>
        </aside>
      </ExampleSurface>
    </div>
  );
}

export const drawerCode = `import { useId } from 'react';
import '@docouno/unica/styles.css';
import { Divider, Stack, Text, Title } from '@docouno/unica';

export function BriefDetails() {
  const headingId = useId();
  return (
    <aside aria-labelledby={headingId} data-surface="overlay" className="unica-overlay-surface"
      style={{ position: 'relative', inlineSize: 'min(100%, 32.5rem)', padding: 'var(--surface-s-padding)' }}>
      <Stack gap={12}>
        <Title id={headingId} as="h2" size="heading-xl" textWrap="balance">
          <bdi>Release brief details</bdi>
        </Title>
        <Divider />
        <Text size="body-s"><bdi>Maintained by the release team.</bdi></Text>
        <Text size="caption-l" color="secondary"><bdi>Review interval · Four weeks</bdi></Text>
      </Stack>
    </aside>
  );
}`;

export function ModalExample({ ctx }: PreviewProps) {
  const dialogId = useId();
  const headingId = dialogId + '-heading';

  return (
    <ExampleSurface surface={ctx.surface}>
      <Stack gap={8} align="start" style={{ inlineSize: '100%', containerType: 'inline-size' }}>
        <Title {...ctx.subject} as="h2" size="heading-m">
          <bdi>Workspace invitations</bdi>
        </Title>
        <Button
          variant="secondary"
          aria-haspopup="dialog"
          aria-controls={dialogId}
          onClick={(event) => {
            const dialog = event.currentTarget.ownerDocument.getElementById(dialogId);
            if (dialog instanceof HTMLDialogElement) {
              dialog.showModal();
            }
          }}
        >
          View invitation policy
        </Button>
        <dialog
          id={dialogId}
          aria-labelledby={headingId}
          className="unica-overlay-surface"
          data-surface="overlay"
          style={{
            inlineSize: 'min(34.25rem, 100cqi, calc(100% - 2rem))',
            maxBlockSize: 'calc(100% - 2rem)',
            padding: 'var(--surface-l-padding)',
            color: 'var(--fg-primary)',
          }}
        >
          <Stack gap={12} align="start">
            <Title id={headingId} as="h2" size="heading-xl" textWrap="balance">
              <bdi>Invitation policy</bdi>
            </Title>
            <Text>
              <bdi>New members can read shared documents. Invitations expire after seven days.</bdi>
            </Text>
            <form method="dialog">
              <Button type="submit" variant="secondary">
                Close
              </Button>
            </form>
          </Stack>
        </dialog>
      </Stack>
    </ExampleSurface>
  );
}

export const modalCode = `import { useId } from 'react';
import '@docouno/unica/styles.css';
import { Button, Stack, Text, Title } from '@docouno/unica';

export function InvitationPolicy() {
  const dialogId = useId();
  const headingId = dialogId + '-heading';
  return (
    <Stack gap={8} align="start" style={{ inlineSize: '100%', containerType: 'inline-size' }}>
      <Title as="h2" size="heading-m"><bdi>Workspace invitations</bdi></Title>
      <Button variant="secondary" aria-haspopup="dialog" aria-controls={dialogId}
        onClick={(event) => {
          const dialog = event.currentTarget.ownerDocument.getElementById(dialogId);
          if (dialog instanceof HTMLDialogElement) {
            dialog.showModal();
          }
        }}>
        View invitation policy
      </Button>
      <dialog id={dialogId} aria-labelledby={headingId} className="unica-overlay-surface" data-surface="overlay"
        style={{ inlineSize: 'min(34.25rem, 100cqi, calc(100% - 2rem))', maxBlockSize: 'calc(100% - 2rem)',
          padding: 'var(--surface-l-padding)', color: 'var(--fg-primary)' }}>
        <Stack gap={12} align="start">
          <Title id={headingId} as="h2" size="heading-xl" textWrap="balance">
            <bdi>Invitation policy</bdi>
          </Title>
          <Text><bdi>New members can read shared documents. Invitations expire after seven days.</bdi></Text>
          <form method="dialog">
            <Button type="submit" variant="secondary">Close</Button>
          </form>
        </Stack>
      </dialog>
    </Stack>
  );
}`;
