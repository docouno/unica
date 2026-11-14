import { defineSpecimen } from '../../workbench/types.js';
import { Kbd, KbdGroup } from './kbd.proto.js';
import { Card, CardHeader } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import '../card/display.examples.css';

export default defineSpecimen({
  id: 'kbd',
  title: 'Kbd & KbdGroup',
  group: 'Typography',
  summary: 'Small keycaps that preserve their baseline and readable shortcut groups.',
  sections: [
    {
      id: 'keys',
      title: 'Keys & combinations',
      kind: 'matrix',
      render: () => (
        <div className="display-example-row">
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>⌥</Kbd>
          <Kbd>↵</Kbd>
          <Kbd>⌫</Kbd>
          <Kbd>K</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>Enter</Kbd>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Inline alignment & wrapping',
      kind: 'states',
      render: () => (
        <div className="display-example-stack">
          <Text size="body-s">
            Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to find any document.
          </Text>
          <KbdGroup>
            <Kbd>Control</Kbd>
            <span>+</span>
            <Kbd>Shift</Kbd>
            <span>+</span>
            <Kbd>ArrowRight</Kbd>
          </KbdGroup>
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Global search',
      kind: 'context',
      render: () => (
        <Card variant="subtle" size="s">
          <CardHeader>
            <Text size="body-s" color="muted">
              Search runbooks, decisions, and people…
            </Text>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </CardHeader>
        </Card>
      ),
    },
  ],
});
