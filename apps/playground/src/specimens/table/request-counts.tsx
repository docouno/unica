import { useId } from 'react';
import { Text } from '@docouno/unica';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableFooter,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableScroll,
} from '../../prototypes/table/table.proto.js';
import '@docouno/unica/styles.css';

export function RequestCounts({
  tableProps = {},
  amountProps = {},
  selected = false,
  subject = {},
} = {}) {
  const captionId = useId();
  const size = { size: 'm', ...tableProps }.size;
  const density = size === 's' ? 'Compact' : size === 'l' ? 'Comfortable' : 'Standard';
  return (
    <TableScroll aria-labelledby={captionId}>
      <Table {...subject} size="m" {...tableProps} style={{ minInlineSize: 'max-content' }}>
        <TableCaption id={captionId}>
          <bdi>
            {density}{' '}
            <Text as="span" size="caption-l" color="muted">
              {size.toUpperCase()}
            </Text>
          </bdi>
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableColumnHeader>Service</TableColumnHeader>
            <TableColumnHeader align="center">Region</TableColumnHeader>
            <TableColumnHeader align="end" {...amountProps}>
              Requests
            </TableColumnHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow selected={selected}>
            <TableRowHeader>Gateway</TableRowHeader>
            <TableCell align="center">
              <bdi>eu-west</bdi>
            </TableCell>
            <TableCell align="end" {...amountProps}>
              <bdi>24,800</bdi>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableRowHeader>Object store</TableRowHeader>
            <TableCell align="center">
              <bdi>us-east</bdi>
            </TableCell>
            <TableCell align="end" {...amountProps}>
              <bdi>1,260</bdi>
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableRowHeader colSpan={2}>Total</TableRowHeader>
            <TableCell align="end" {...amountProps}>
              <bdi>26,060</bdi>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableScroll>
  );
}
