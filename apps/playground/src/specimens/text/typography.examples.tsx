import type { ReactElement, ReactNode } from 'react';
import { Text, Title } from '@docouno/unica';
import './typography.examples.css';

export const longCopy =
  'Keep the release checklist close to the decisions it explains. Add a clear owner, record the next review date, and share the context with everyone in the workspace.';
export const longHeading = 'A shared place for the knowledge that moves your team forward';

export function Example({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="type-example">
      <Text size="caption-l" color="secondary" className="type-example-label">
        {label}
      </Text>
      <div className="type-example-content">{children}</div>
    </div>
  );
}

export function SignInCopy(): ReactElement {
  return (
    <div className="type-study type-context type-auth">
      <Text size="caption-l" weight="semibold" color="accent">
        FOLIO / YOUR TEAM LIBRARY
      </Text>
      <Title textWrap="balance">Good work starts with shared context.</Title>
      <Text color="secondary">
        Bring your notes, decisions, and people together in one calm workspace.
      </Text>
      <div className="type-context-divider" />
      <Text size="body-s">Continue with your work email.</Text>
      <Text size="caption-l" color="muted">
        Single sign-on is available for your organization.
      </Text>
    </div>
  );
}

export function EditorCopy(): ReactElement {
  return (
    <article className="type-study type-context type-prose">
      <Text size="caption-l" color="muted">
        DRAFT / ALL CHANGES SAVED
      </Text>
      <Title textWrap="balance">Make room for the next good idea</Title>
      <Text size="body-l">
        Knowledge becomes useful when a reader can find the decision, understand the reason, and
        take the next step.
      </Text>
      <Title as="h2" size="heading-l">
        Write for the next person
      </Title>
      <Text>{longCopy}</Text>
      <Text>
        Keep paragraphs short enough to scan. Use headings to describe the question a section
        answers, then let the body carry the detail.
      </Text>
    </article>
  );
}

export function OverlayCopy({ kind }: { readonly kind: 'drawer' | 'modal' }): ReactElement {
  return (
    <div className={`type-study type-context type-${kind}`}>
      <Text size="caption-l" color="muted">
        {kind === 'drawer' ? 'PAGE DETAILS' : 'WORKSPACE ACCESS'}
      </Text>
      <Title as="h2" size="heading-xl" textWrap="balance">
        {kind === 'drawer' ? 'Everything this page connects' : 'Invite your team to the workspace'}
      </Title>
      <Text color="secondary">
        {kind === 'drawer'
          ? 'Keep ownership, review dates, and related decisions close to the document.'
          : 'Give people the context and access they need to contribute with confidence.'}
      </Text>
      <div className="type-context-divider" />
      <Title as="h3" size="heading-s">
        {kind === 'drawer' ? 'Release readiness checklist' : 'Review access before sending'}
      </Title>
      <Text size="body-s">
        {kind === 'drawer'
          ? 'Maintained by the platform team. Next review in four weeks.'
          : 'New members can read shared documents. Editing permissions can be changed at any time.'}
      </Text>
      <Text size="caption-l" color="subtle">
        {kind === 'drawer'
          ? 'Updated today · 3 related documents'
          : 'Invitations expire after seven days.'}
      </Text>
    </div>
  );
}
