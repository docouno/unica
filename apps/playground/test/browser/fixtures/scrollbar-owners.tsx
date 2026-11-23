import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Textarea,
} from '@docouno/unica';
import type { JSX } from 'react';
import { CodeBlock } from '../../../src/prototypes/code-block/code-block.proto.js';
import { MenuRows, MenuSurface } from '../../../src/prototypes/menu/menu.proto.js';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableScroll,
} from '../../../src/prototypes/table/table.proto.js';

const rows = Array.from({ length: 24 }, (_, index) => `Review document ${index + 1}`);

export default function ScrollbarOwnersFixture(): JSX.Element {
  return (
    <div style={{ display: 'grid', alignItems: 'start', gap: 16, inlineSize: 'min(100%, 360px)' }}>
      <Popover>
        <PopoverTrigger>Open reference</PopoverTrigger>
        <PopoverContent style={{ maxBlockSize: 224 }}>
          <PopoverHeader data-testid="popover-header">
            <PopoverTitle>Reference</PopoverTitle>
            <PopoverClose />
          </PopoverHeader>
          <PopoverBody aria-label="Reference entries" role="region" tabIndex={0}>
            <ol>
              {rows.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ol>
          </PopoverBody>
          <PopoverFooter data-testid="popover-footer">End of reference</PopoverFooter>
        </PopoverContent>
      </Popover>
      <MenuSurface aria-label="Documents">
        <MenuRows
          items={rows.map((label) => ({ id: label, label }))}
          role="menu"
          aria-label="Documents"
          style={{ maxBlockSize: 140 }}
        />
      </MenuSurface>
      <div
        data-testid="nested-compact"
        className="unica-scrollbar unica-scrollbar--compact"
        style={{ inlineSize: 240, blockSize: 140, overflow: 'auto' }}
      >
        <CodeBlock tabIndex={0} role="region" aria-label="Query log" style={{ maxBlockSize: 90 }}>
          {rows.map((row) => `SELECT title FROM items WHERE title = '${row}';`).join('\n')}
        </CodeBlock>
        <div style={{ blockSize: 200 }} />
      </div>
      <TableScroll aria-label="Document grid" style={{ inlineSize: 240, blockSize: 100 }}>
        <Table style={{ minInlineSize: 360 }}>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row}>
                <TableCell>{row}</TableCell>
                <TableCell>Ready</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
      <Textarea aria-label="Document list" defaultValue={rows.join('\n')} />
      <section
        className="unica-scrollbar unica-scrollbar--compact"
        aria-label="A single entry"
        tabIndex={0}
        style={{ blockSize: 80, overflow: 'auto' }}
      >
        {rows[0]}
      </section>
    </div>
  );
}
