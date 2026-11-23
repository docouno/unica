import { Fragment, useMemo } from 'react';
import type { MouseEvent, ReactElement, ReactNode } from 'react';
import { InspectorCode } from './InspectorCode.js';
import {
  isExternalHref,
  isSafeHref,
  parseMarkdownBlocks,
  stripInlineSyntax,
} from './markdownParser.js';
import type { BlockNode } from './markdownParser.js';
import './markdown.css';

export interface ResolvedMarkdownLink {
  readonly href: string;
  readonly onNavigate?: () => void;
  readonly external?: boolean;
}

export interface MarkdownViewProps {
  readonly markdown: string;
  readonly raw?: boolean;
  readonly resolveLink?: (href: string) => ResolvedMarkdownLink | null;
}

function findCodeSpanClose(text: string, startAfterOpen: number, tickCount: number): number {
  let i = startAfterOpen;
  while (i < text.length) {
    if (text[i] === '`') {
      let run = 1;
      while (text[i + run] === '`') {
        run += 1;
      }
      if (run === tickCount) {
        return i;
      }
      i += run;
    } else {
      i += 1;
    }
  }
  return -1;
}

function findMatchingBracket(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i]!;
    if (ch === '\\') {
      i += 1;
      continue;
    }
    if (ch === '`') {
      let run = 1;
      while (text[i + run] === '`') {
        run += 1;
      }
      const close = findCodeSpanClose(text, i + run, run);
      if (close !== -1) {
        i = close + run - 1;
      } else {
        i += run - 1;
      }
      continue;
    }
    if (ch === '[') {
      depth += 1;
    } else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function findMatchingParen(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i]!;
    if (ch === '\\') {
      i += 1;
      continue;
    }
    if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function findInlineDelimiter(text: string, delimiter: string, fromIndex: number): number {
  let i = fromIndex;
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2;
      continue;
    }
    if (text[i] === '`') {
      let run = 1;
      while (text[i + run] === '`') {
        run += 1;
      }
      const close = findCodeSpanClose(text, i + run, run);
      i = close !== -1 ? close + run : i + run;
      continue;
    }
    if (text.startsWith(delimiter, i)) {
      return i;
    }
    i += 1;
  }
  return -1;
}

function shouldFollowInPlace(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

function scrollToDocAnchor(targetId: string): void {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

function renderInline(
  text: string,
  resolveLink: MarkdownViewProps['resolveLink'],
  keyPrefix: string,
  insideLink = false,
): ReactNode[] {
  const output: ReactNode[] = [];
  let buffer = '';
  let index = 0;
  let token = 0;

  const flush = (): void => {
    if (buffer) {
      output.push(buffer);
      buffer = '';
    }
  };

  while (index < text.length) {
    const ch = text[index]!;

    // Backslash escape for ASCII punctuation.
    if (ch === '\\' && index + 1 < text.length && /[\\`*_{}[\]()#+\-.!|]/.test(text[index + 1]!)) {
      buffer += text[index + 1]!;
      index += 2;
      continue;
    }

    // Inline code span (CommonMark exact-length backtick matching).
    if (ch === '`') {
      let tickCount = 1;
      while (text[index + tickCount] === '`') {
        tickCount += 1;
      }
      const closeIndex = findCodeSpanClose(text, index + tickCount, tickCount);
      if (closeIndex !== -1) {
        flush();
        let codeText = text.slice(index + tickCount, closeIndex);
        if (
          codeText.length >= 2 &&
          codeText.startsWith(' ') &&
          codeText.endsWith(' ') &&
          /[^ ]/.test(codeText)
        ) {
          codeText = codeText.slice(1, -1);
        }
        output.push(
          <code key={`${keyPrefix}-c-${String(token++)}`} className="wb-md-inline-code">
            {codeText}
          </code>,
        );
        index = closeIndex + tickCount;
        continue;
      }
      buffer += '`'.repeat(tickCount);
      index += tickCount;
      continue;
    }

    // Link: [label](href) — disallow nested anchors.
    if (ch === '[' && !insideLink) {
      const closeBracket = findMatchingBracket(text, index);
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = findMatchingParen(text, closeBracket + 1);
        if (closeParen !== -1) {
          const label = text.slice(index + 1, closeBracket);
          const rawHref = text.slice(closeBracket + 2, closeParen).trim();
          const withoutTitle = rawHref.replace(/\s+(?:"[^"]*"|'[^']*'|\([^)]*\))$/, '').trim();
          const href =
            withoutTitle.startsWith('<') && withoutTitle.endsWith('>')
              ? withoutTitle.slice(1, -1)
              : withoutTitle;
          flush();
          const linkKey = `${keyPrefix}-a-${String(token++)}`;
          const children = renderInline(label, resolveLink, linkKey, true);
          const safe = isSafeHref(href);
          const resolved = safe ? resolveLink?.(href) : null;
          if (resolved && isSafeHref(resolved.href)) {
            output.push(
              <a
                key={linkKey}
                href={resolved.href}
                target={resolved.external ? '_blank' : undefined}
                rel={resolved.external ? 'noopener noreferrer' : undefined}
                onClick={
                  resolved.onNavigate
                    ? (event) => {
                        if (shouldFollowInPlace(event)) {
                          event.preventDefault();
                          resolved.onNavigate?.();
                        }
                      }
                    : undefined
                }
              >
                {children}
              </a>,
            );
          } else if (safe && href.startsWith('#') && href.length > 1) {
            const rawSlug = href.slice(1).toLowerCase();
            const targetId = rawSlug.startsWith('wb-doc-') ? rawSlug : `wb-doc-${rawSlug}`;
            output.push(
              <a
                key={linkKey}
                href={`#${targetId}`}
                onClick={(event) => {
                  if (shouldFollowInPlace(event)) {
                    event.preventDefault();
                    scrollToDocAnchor(targetId);
                  }
                }}
              >
                {children}
              </a>,
            );
          } else if (safe && (isExternalHref(href) || /^mailto:/i.test(href))) {
            const external = isExternalHref(href);
            output.push(
              <a
                key={linkKey}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>,
            );
          } else {
            output.push(
              <span key={linkKey} className="wb-md-doc-ref" title={safe ? href : undefined}>
                {children}
              </span>,
            );
          }
          index = closeParen + 1;
          continue;
        }
      }
    }

    // Strong: **...** or __...__
    if ((ch === '*' && text[index + 1] === '*') || (ch === '_' && text[index + 1] === '_')) {
      const delim = text.slice(index, index + 2);
      const closeIndex = findInlineDelimiter(text, delim, index + 2);
      if (closeIndex !== -1 && closeIndex > index + 2) {
        flush();
        const k = `${keyPrefix}-s-${String(token++)}`;
        output.push(
          <strong key={k}>
            {renderInline(text.slice(index + 2, closeIndex), resolveLink, k, insideLink)}
          </strong>,
        );
        index = closeIndex + 2;
        continue;
      }
    }

    // Strikethrough: ~~...~~
    if (ch === '~' && text[index + 1] === '~') {
      const closeIndex = findInlineDelimiter(text, '~~', index + 2);
      if (closeIndex !== -1 && closeIndex > index + 2) {
        flush();
        const k = `${keyPrefix}-d-${String(token++)}`;
        output.push(
          <del key={k}>
            {renderInline(text.slice(index + 2, closeIndex), resolveLink, k, insideLink)}
          </del>,
        );
        index = closeIndex + 2;
        continue;
      }
    }

    // Emphasis: *...* or word-bounded _..._
    if (ch === '*' || (ch === '_' && (index === 0 || /\W/.test(text[index - 1]!)))) {
      const closeIndex = findInlineDelimiter(text, ch, index + 1);
      const validBoundary =
        ch === '*' ||
        closeIndex === text.length - 1 ||
        (closeIndex > 0 && /\W/.test(text[closeIndex + 1]!));
      if (closeIndex !== -1 && closeIndex > index + 1 && validBoundary && text[index + 1] !== ' ') {
        flush();
        const k = `${keyPrefix}-e-${String(token++)}`;
        output.push(
          <em key={k}>
            {renderInline(text.slice(index + 1, closeIndex), resolveLink, k, insideLink)}
          </em>,
        );
        index = closeIndex + 1;
        continue;
      }
    }

    buffer += ch;
    index += 1;
  }

  flush();
  return output;
}

function renderBlocks(
  blocks: readonly BlockNode[],
  resolveLink: MarkdownViewProps['resolveLink'],
  raw: boolean,
  keyPrefix: string,
): ReactNode {
  return blocks.map((block, index) => {
    const key = `${keyPrefix}-${String(index)}`;
    switch (block.type) {
      case 'heading': {
        // Shift heading levels by +1 so Markdown H1 sits under the Workbench page H1.
        const level = Math.min(6, block.level + 1);
        const content = renderInline(block.text, resolveLink, key);
        if (level === 2) {
          return (
            <h2 key={key} id={block.id}>
              {content}
            </h2>
          );
        }
        if (level === 3) {
          return (
            <h3 key={key} id={block.id}>
              {content}
            </h3>
          );
        }
        if (level === 4) {
          return (
            <h4 key={key} id={block.id}>
              {content}
            </h4>
          );
        }
        if (level === 5) {
          return (
            <h5 key={key} id={block.id}>
              {content}
            </h5>
          );
        }
        return (
          <h6 key={key} id={block.id}>
            {content}
          </h6>
        );
      }
      case 'paragraph':
        return <p key={key}>{renderInline(block.text, resolveLink, key)}</p>;
      case 'code':
        return (
          <InspectorCode
            key={key}
            code={block.code}
            language={block.language}
            format={false}
            copyable={!raw}
            standalone
          />
        );
      case 'hr':
        return <hr key={key} className="wb-md-hr" />;
      case 'blockquote':
        return (
          <blockquote key={key} className="wb-md-quote" data-wb-alert={block.alert}>
            {block.alert && <p className="wb-md-alert-label">{block.alert}</p>}
            {renderBlocks(block.blocks, resolveLink, raw, key)}
          </blockquote>
        );
      case 'list': {
        const Tag = block.ordered ? 'ol' : 'ul';
        return (
          <Tag key={key} className="wb-md-list">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                {renderInline(item.text, resolveLink, `${key}-i-${String(itemIndex)}`)}
                {item.children.length > 0 && (
                  <Fragment>
                    {renderBlocks(
                      item.children,
                      resolveLink,
                      raw,
                      `${key}-sub-${String(itemIndex)}`,
                    )}
                  </Fragment>
                )}
              </li>
            ))}
          </Tag>
        );
      }
      case 'table': {
        const tableLabel =
          block.headers.map(stripInlineSyntax).filter(Boolean).join(', ') || 'Reference table';
        return (
          <div
            key={key}
            className="wb-md-table-wrap wb-scroll"
            role="region"
            aria-label={tableLabel}
            tabIndex={0}
          >
            <table className="wb-md-table">
              <thead>
                <tr>
                  {block.headers.map((header, cellIndex) => (
                    <th
                      key={cellIndex}
                      scope="col"
                      style={
                        block.alignments[cellIndex]
                          ? { textAlign: block.alignments[cellIndex] }
                          : undefined
                      }
                    >
                      {renderInline(header, resolveLink, `${key}-th-${String(cellIndex)}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {block.headers.map((_, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={
                          block.alignments[cellIndex]
                            ? { textAlign: block.alignments[cellIndex] }
                            : undefined
                        }
                      >
                        {renderInline(
                          row[cellIndex] ?? '',
                          resolveLink,
                          `${key}-td-${String(rowIndex)}-${String(cellIndex)}`,
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
  });
}

export function MarkdownView({
  markdown,
  raw = false,
  resolveLink,
}: MarkdownViewProps): ReactElement {
  const blocks = useMemo(() => parseMarkdownBlocks(markdown), [markdown]);

  return (
    <div className="wb-markdown" dir="auto">
      {renderBlocks(blocks, resolveLink, raw, 'md')}
    </div>
  );
}
