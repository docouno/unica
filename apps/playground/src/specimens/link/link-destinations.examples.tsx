import { useSyncExternalStore } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { FileTextIcon } from '@phosphor-icons/react';
import { Flex, Link, Stack, Text, Title } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { focusLinkedFragment, specimenBlockPage } from '../shared/specimen-fragment.js';
import './link-destinations.examples.css';

const revision = 'Section links now keep their location when reopened in a new tab.';
const releaseNotes = `Release notes\n\n${revision}\n`;

function RouteAnchor({
  to,
  ...anchorProps
}: Omit<ComponentPropsWithRef<'a'>, 'href'> & { readonly to: string }): ReactElement {
  return <a {...anchorProps} href={to} />;
}

export function LinkDestinations({ ctx }: PreviewProps): ReactElement {
  const disabled = ctx.story?.controls.disabled === true;
  const id = `link-release-${ctx.theme.id}`;
  const page = specimenBlockPage('link', 'states', 'destinations', ctx.theme.id);

  return (
    <Stack gap={16}>
      <Text>
        <bdi>
          <Link {...ctx.subject} asChild disabled={disabled} iconLeft={FileTextIcon}>
            <RouteAnchor to={`${page}#${id}`} aria-describedby={`${id}-availability`}>
              Release notes
            </RouteAnchor>
          </Link>{' '}
          <span id={`${id}-availability`}>
            {disabled ? 'Available after review.' : 'Read the latest revision.'}
          </span>
        </bdi>
      </Text>
      <Stack
        id={id}
        ref={focusLinkedFragment}
        role="region"
        aria-labelledby={`${id}-heading`}
        tabIndex={-1}
        className="link-fragment-section"
        gap={4}
      >
        <Title as="h3" size="body-m" id={`${id}-heading`}>
          Release notes
        </Title>
        <Text size="body-s">
          <bdi>{revision}</bdi>
        </Text>
      </Stack>
      <Text>
        <Link
          {...ctx.subject}
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(releaseNotes)}`}
          download="release-notes.txt"
          target="_blank"
        >
          Download release notes
        </Link>
      </Text>
      <Text>
        <Link
          {...ctx.subject}
          href="https://www.w3.org/WAI/fundamentals/accessibility-intro/es"
          target="_blank"
          lang="es"
          newTabHint="Se abre en una pestaña nueva"
        >
          Introducción a la accesibilidad web
        </Link>
      </Text>
    </Stack>
  );
}

function subscribeToFragment(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getFragment = (): string => window.location.hash;
const initialFragment = (): string => '';

export function LinkLiveNavigation({ ctx }: PreviewProps): ReactElement {
  const id = `link-reading-${ctx.theme.id}`;
  const page = specimenBlockPage('link', 'states', 'live', ctx.theme.id);
  const fragment = useSyncExternalStore(subscribeToFragment, getFragment, initialFragment);

  return (
    <Stack gap={16}>
      <nav aria-label="On this example">
        <Flex gap={16} wrap="wrap" align="baseline">
          {(['Summary', 'Details'] as const).map((label) => {
            const hash = `#${id}-${label.toLowerCase()}`;
            const current = fragment === hash || (fragment === '' && label === 'Summary');
            return (
              <Link
                {...ctx.subject}
                key={label}
                className="link-fragment-jump"
                href={page + hash}
                underline="hover"
                aria-current={current ? 'location' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </Flex>
      </nav>
      <Stack
        id={`${id}-summary`}
        ref={focusLinkedFragment}
        role="region"
        aria-labelledby={`${id}-summary-heading`}
        className="link-fragment-section"
        tabIndex={-1}
        gap={4}
      >
        <Title as="h3" size="body-m" id={`${id}-summary-heading`}>
          Summary
        </Title>
        <Text size="body-s">
          <bdi>Follow either section link. Back and Forward restore the current location.</bdi>
        </Text>
      </Stack>
      <Stack
        id={`${id}-details`}
        ref={focusLinkedFragment}
        role="region"
        aria-labelledby={`${id}-details-heading`}
        className="link-fragment-section"
        tabIndex={-1}
        gap={4}
      >
        <Title as="h3" size="body-m" id={`${id}-details-heading`}>
          Details
        </Title>
        <Text size="body-s">
          <Link {...ctx.subject} href="https://www.w3.org/WAI/" target="_blank">
            Open the accessibility reference
          </Link>
        </Text>
      </Stack>
      <Stack gap={4}>
        <Text size="body-s">
          <Link {...ctx.subject} disabled aria-describedby={`${id}-archive`}>
            Download archive
          </Link>
        </Text>
        <Text size="caption-l" color="secondary" id={`${id}-archive`}>
          <bdi>The archive is being prepared.</bdi>
        </Text>
      </Stack>
    </Stack>
  );
}
