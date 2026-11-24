import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { Button, Card, Flex, Input, Stack, Text, Title } from '@docouno/unica';
import { CloudSlashIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { PreviewProps } from '../../workbench/types.js';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableRow,
  TableRowHeader,
} from '../table/table.proto.js';
import { Empty, EmptyActions, EmptyDescription, EmptyMedia, EmptyTitle } from './empty.proto.js';
import './empty.examples.css';

const runbooks = [
  { title: 'Incident response', owner: 'Operations' },
  { title: 'Database recovery', owner: 'Data team' },
];

export function EmptySearchExample({ ctx }: PreviewProps): ReactElement {
  const [query, setQuery] = useState('release checklist');
  const input = useRef<HTMLInputElement>(null);
  const emptyHeading = useRef<HTMLHeadingElement>(null);
  const term = query.trim().toLowerCase();
  const results = runbooks.filter((row) => row.title.toLowerCase().includes(term));

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (results.length === 0) {
      emptyHeading.current?.focus();
    }
  }

  return (
    <Stack
      gap={8}
      data-example-disclosure=""
      style={{ inlineSize: 'min(100%, 35rem)', marginInline: 'auto' }}
    >
      <form onSubmit={submit} role="search" aria-label="Runbooks">
        <Flex gap={8} wrap="wrap">
          <Input
            ref={input}
            size="s"
            iconLeft={MagnifyingGlassIcon}
            style={{ flex: '1 1 12em', minInlineSize: 0 }}
            aria-label="Find runbooks"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <Button type="submit" size="s" variant="secondary" tone="neutral">
            Search
          </Button>
        </Flex>
      </form>
      <Text size="caption-l" color="muted" role="status" aria-atomic="true">
        <bdi>{`${results.length} ${results.length === 1 ? 'runbook' : 'runbooks'} found`}</bdi>
      </Text>
      <Card size="s" style={{ padding: 0 }}>
        <Table size="s" className="empty-example-table" aria-label="Runbooks">
          <TableHeader>
            <TableRow>
              <TableColumnHeader>Name</TableColumnHeader>
              <TableColumnHeader>Owner</TableColumnHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length ? (
              results.map(({ title, owner }) => (
                <TableRow key={title}>
                  <TableRowHeader>{title}</TableRowHeader>
                  <TableCell>{owner}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="empty-example-cell" colSpan={2}>
                  <Empty {...ctx.subject} size="s">
                    <EmptyMedia icon={MagnifyingGlassIcon} />
                    <EmptyTitle ref={emptyHeading} tabIndex={-1}>
                      No matching runbooks
                    </EmptyTitle>
                    <EmptyDescription>
                      <bdi>Try a different search or clear this one.</bdi>
                    </EmptyDescription>
                    <EmptyActions>
                      <Button
                        size="s"
                        variant="secondary"
                        tone="neutral"
                        onClick={() => {
                          setQuery('');
                          input.current?.focus();
                        }}
                      >
                        Clear search
                      </Button>
                    </EmptyActions>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );
}

export function EmptyRecoveryExample({ ctx }: PreviewProps): ReactElement {
  const [phase, setPhase] = useState<'failed' | 'retrying' | 'ready'>('failed');
  const [retried, setRetried] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const retry = useRef<HTMLButtonElement>(null);
  const readyHeading = useRef<HTMLHeadingElement>(null);
  const transferFocus = useRef(false);

  useEffect(() => {
    if (phase !== 'retrying') {
      return;
    }
    const timer = window.setTimeout(() => {
      if (!retried) {
        setRetried(true);
        setAnnouncement('Retry failed');
        setPhase('failed');
        return;
      }
      const button = retry.current;
      transferFocus.current = button !== null && button.ownerDocument.activeElement === button;
      setAnnouncement(transferFocus.current ? '' : 'Two reports loaded');
      setPhase('ready');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [phase, retried]);

  useLayoutEffect(() => {
    const heading = readyHeading.current;
    if (
      transferFocus.current &&
      heading &&
      heading.ownerDocument.activeElement === heading.ownerDocument.body
    ) {
      heading.focus();
    }
    transferFocus.current = false;
  }, [phase]);

  return (
    <Card style={{ inlineSize: 'min(100%, 30rem)', marginInline: 'auto' }}>
      <Flex
        align="center"
        justify="center"
        style={{ minBlockSize: '13.5rem', padding: 'var(--space-8)' }}
      >
        {phase === 'ready' ? (
          <Stack gap={8} style={{ inlineSize: '100%' }}>
            <Title
              ref={readyHeading}
              as="h3"
              size="heading-m"
              tabIndex={-1}
              className="empty-example-reports-title"
            >
              Reports
            </Title>
            <ul>
              <li>Quarterly access review</li>
              <li>Delivery health summary</li>
            </ul>
          </Stack>
        ) : (
          <Empty {...ctx.subject}>
            <EmptyMedia icon={CloudSlashIcon} color="danger" />
            <EmptyTitle>Couldn’t load reports</EmptyTitle>
            <EmptyDescription>
              <bdi>The report service didn’t respond. Try loading the reports again.</bdi>
            </EmptyDescription>
            <EmptyActions>
              <Button
                ref={retry}
                variant="secondary"
                tone="neutral"
                loading={phase === 'retrying'}
                onClick={() => {
                  setAnnouncement('Reconnecting…');
                  setPhase('retrying');
                }}
              >
                Try again
              </Button>
            </EmptyActions>
          </Empty>
        )}
      </Flex>
      <Text
        size="caption-l"
        color="muted"
        role="status"
        aria-atomic="true"
        style={{ minBlockSize: '1lh' }}
      >
        <bdi>{announcement}</bdi>
      </Text>
    </Card>
  );
}
