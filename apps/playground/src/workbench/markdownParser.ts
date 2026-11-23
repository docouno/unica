export interface MarkdownHeading {
  readonly id: string;
  readonly level: number;
  readonly text: string;
}

export interface ListItemNode {
  readonly text: string;
  readonly children: readonly BlockNode[];
}

export type BlockNode =
  | { readonly type: 'heading'; readonly level: number; readonly id: string; readonly text: string }
  | { readonly type: 'paragraph'; readonly text: string }
  | { readonly type: 'code'; readonly language: string; readonly code: string }
  | {
      readonly type: 'table';
      readonly headers: readonly string[];
      readonly alignments: readonly ('left' | 'center' | 'right' | undefined)[];
      readonly rows: readonly (readonly string[])[];
    }
  | {
      readonly type: 'list';
      readonly ordered: boolean;
      readonly items: readonly ListItemNode[];
    }
  | {
      readonly type: 'blockquote';
      readonly alert?: string;
      readonly blocks: readonly BlockNode[];
    }
  | { readonly type: 'hr' };

export function stripInlineSyntax(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*|__|~~/g, '')
    .replace(/(^|[^\w])\*([^*]+)\*(?=[^\w]|$)/g, '$1$2')
    .replace(/(^|[^\w])_([^_]+)_(?=[^\w]|$)/g, '$1$2')
    .trim();
}

export function slugifyHeading(text: string): string {
  const slug = stripInlineSyntax(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return slug || 'section';
}

function createSlugger(): (text: string) => string {
  const used = new Set<string>();
  return (text: string): string => {
    const base = `wb-doc-${slugifyHeading(text)}`;
    if (!used.has(base)) {
      used.add(base);
      return base;
    }
    let suffix = 2;
    while (used.has(`${base}-${String(suffix)}`)) {
      suffix += 1;
    }
    const unique = `${base}-${String(suffix)}`;
    used.add(unique);
    return unique;
  };
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!;
    if (ch === '\\' && trimmed[i + 1] === '|') {
      current += '|';
      i += 1;
    } else if (ch === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function hasUnescapedPipe(line: string): boolean {
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '\\' && line[i + 1] === '|') {
      i += 1;
      continue;
    }
    if (line[i] === '|') {
      return true;
    }
  }
  return false;
}

function parseTableAlignments(
  line: string,
  expectedColumns: number,
): readonly ('left' | 'center' | 'right' | undefined)[] | null {
  if (!line.includes('|')) {
    return null;
  }
  const cells = splitTableRow(line);
  if (cells.length === 0 || cells.length !== expectedColumns) {
    return null;
  }
  const alignments: ('left' | 'center' | 'right' | undefined)[] = [];
  for (const cell of cells) {
    if (!/^:?-{1,}:?$/.test(cell)) {
      return null;
    }
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    alignments.push(left && right ? 'center' : right ? 'right' : left ? 'left' : undefined);
  }
  return alignments;
}

function isFenceStart(line: string): { marker: string; language: string } | null {
  const match = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) {
    return null;
  }
  const marker = match[1]!;
  const info = match[2]!.trim();
  // CommonMark: backtick fence info strings cannot contain backticks (prevents inline ```code``` false positives).
  if (marker[0] === '`' && info.includes('`')) {
    return null;
  }
  const language = info.split(/\s+/)[0] ?? '';
  return { marker, language };
}

function isHorizontalRule(line: string): boolean {
  return /^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(line);
}

function parseListLine(line: string): {
  readonly indent: number;
  readonly ordered: boolean;
  readonly text: string;
} | null {
  const match = /^(\s*)(?:([-*+])|(\d+)\.)\s+(.*)$/.exec(line);
  if (!match) {
    return null;
  }
  return {
    indent: match[1]!.length,
    ordered: match[3] !== undefined,
    text: match[4]!,
  };
}

function isBlockStart(lines: readonly string[], index: number): boolean {
  const line = lines[index] ?? '';
  if (!line.trim()) {
    return true;
  }
  if (/^\s{0,3}#{1,6}\s+/.test(line)) {
    return true;
  }
  if (isFenceStart(line) || isHorizontalRule(line)) {
    return true;
  }
  if (/^\s{0,3}>\s?/.test(line)) {
    return true;
  }
  if (parseListLine(line)) {
    return true;
  }
  const next = lines[index + 1];
  if (
    line.includes('|') &&
    next !== undefined &&
    parseTableAlignments(next, splitTableRow(line).length) !== null
  ) {
    return true;
  }
  return false;
}

function stripFrontmatter(lines: readonly string[]): readonly string[] {
  if (lines[0]?.trim() !== '---') {
    return lines;
  }
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i]?.trim() === '---') {
      return lines.slice(i + 1);
    }
  }
  return lines;
}

function parseLines(
  lines: readonly string[],
  slugger: (text: string) => string,
): readonly BlockNode[] {
  const blocks: BlockNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]!;
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = isFenceStart(line);
    if (fence) {
      const codeLines: string[] = [];
      const closePattern = new RegExp(
        `^\\s{0,3}${fence.marker[0]!}{${String(fence.marker.length)},}\\s*$`,
      );
      index += 1;
      while (index < lines.length && !closePattern.test(lines[index]!)) {
        codeLines.push(lines[index]!);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({
        type: 'code',
        language: fence.language || 'text',
        code: codeLines.join('\n'),
      });
      continue;
    }

    // Linear-time CommonMark ATX heading match (avoids backtracking and preserves trailing `#` like `C#`).
    const heading = /^\s{0,3}(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const text = heading[2]!.trim().replace(/\s+#+$/, '');
      if (text.length > 0) {
        blocks.push({
          type: 'heading',
          level: heading[1]!.length,
          id: slugger(text),
          text,
        });
        index += 1;
        continue;
      }
    }

    if (isHorizontalRule(line)) {
      blocks.push({ type: 'hr' });
      index += 1;
      continue;
    }

    const nextLine = lines[index + 1];
    if (hasUnescapedPipe(line) && nextLine !== undefined) {
      const headers = splitTableRow(line);
      const alignments = parseTableAlignments(nextLine, headers.length);
      if (alignments) {
        index += 2;
        const rows: string[][] = [];
        while (index < lines.length) {
          const rowLine = lines[index]!;
          if (!rowLine.trim() || !rowLine.includes('|')) {
            break;
          }
          rows.push(splitTableRow(rowLine));
          index += 1;
        }
        blocks.push({ type: 'table', headers, alignments, rows });
        continue;
      }
    }

    if (/^\s{0,3}>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index]!)) {
        quoteLines.push(lines[index]!.replace(/^\s{0,3}>\s?/, ''));
        index += 1;
      }
      let alert: string | undefined;
      const firstQuoteLine = quoteLines[0]?.trim() ?? '';
      const alertMatch = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$/.exec(firstQuoteLine);
      if (alertMatch) {
        alert = alertMatch[1]!.toLowerCase();
        quoteLines.shift();
      }
      blocks.push({
        type: 'blockquote',
        ...(alert ? { alert } : {}),
        blocks: parseLines(quoteLines, slugger),
      });
      continue;
    }

    const listStart = parseListLine(line);
    if (listStart) {
      const baseIndent = listStart.indent;
      const ordered = listStart.ordered;
      const items: ListItemNode[] = [];
      while (index < lines.length) {
        const current = parseListLine(lines[index]!);
        if (!current || current.indent !== baseIndent || current.ordered !== ordered) {
          break;
        }
        const itemLines = [current.text];
        const nestedLines: string[] = [];
        index += 1;
        while (index < lines.length) {
          const lookahead = lines[index]!;
          if (!lookahead.trim()) {
            const afterBlank = lines[index + 1];
            const afterItem = afterBlank ? parseListLine(afterBlank) : null;
            if (afterItem && afterItem.indent > baseIndent) {
              nestedLines.push('');
              index += 1;
              continue;
            }
            // Keep loose list items of the same level/type in one list.
            if (afterItem && afterItem.indent === baseIndent && afterItem.ordered === ordered) {
              index += 1;
            }
            break;
          }
          const subItem = parseListLine(lookahead);
          if (subItem) {
            if (subItem.indent > baseIndent) {
              nestedLines.push(lookahead.slice(Math.min(subItem.indent, baseIndent + 2)));
              index += 1;
              continue;
            }
            break;
          }
          const leadingSpaces = lookahead.search(/\S/);
          if (leadingSpaces > baseIndent) {
            if (nestedLines.length > 0) {
              nestedLines.push(lookahead.slice(Math.min(leadingSpaces, baseIndent + 2)));
            } else {
              itemLines.push(lookahead.trim());
            }
            index += 1;
            continue;
          }
          break;
        }
        items.push({
          text: itemLines.join(' '),
          children: nestedLines.length > 0 ? parseLines(nestedLines, slugger) : [],
        });
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [line.trim()];
    index += 1;
    while (index < lines.length && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index]!.trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

export function parseMarkdownBlocks(markdown: string): readonly BlockNode[] {
  const lines = stripFrontmatter(markdown.split(/\r?\n/));
  return parseLines(lines, createSlugger());
}

export function extractMarkdownHeadings(markdown: string): readonly MarkdownHeading[] {
  const blocks = parseMarkdownBlocks(markdown);
  const headings: MarkdownHeading[] = [];
  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 2) {
      headings.push({
        id: block.id,
        level: block.level,
        text: stripInlineSyntax(block.text),
      });
    }
  }
  return headings;
}

export function isSafeHref(rawHref: string): boolean {
  let normalized = '';
  for (let i = 0; i < rawHref.length; i += 1) {
    if (rawHref.charCodeAt(i) > 0x20) {
      normalized += rawHref[i]!.toLowerCase();
    }
  }
  if (!normalized || /^[/\\]{2}/.test(normalized)) {
    return false;
  }
  if (/^[a-z][a-z0-9+.-]*:/.test(normalized)) {
    return (
      normalized.startsWith('http:') ||
      normalized.startsWith('https:') ||
      normalized.startsWith('mailto:')
    );
  }
  return true;
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
