import { useState } from 'react';
import { ListBulletsIcon, ListNumbersIcon, TextBIcon, TextItalicIcon } from '@phosphor-icons/react';
import { Divider, Flex, IconButton, Stack, Text } from '@docouno/unica';

export function FormattingToolbar({ dividerProps = {} } = {}) {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [list, setList] = useState('');
  const Block = list === 'bullets' ? 'ul' : list === 'numbers' ? 'ol' : 'div';
  const Line = list ? 'li' : 'div';

  return (
    <Stack gap={12}>
      <Flex align="center" gap={12} role="group" aria-label="Text formatting">
        <Flex gap={4} role="group" aria-label="Emphasis">
          <IconButton
            size="s"
            variant="ghost"
            icon={TextBIcon}
            aria-label="Bold"
            pressed={bold}
            onPressedChange={setBold}
          />
          <IconButton
            size="s"
            variant="ghost"
            icon={TextItalicIcon}
            aria-label="Italic"
            pressed={italic}
            onPressedChange={setItalic}
          />
        </Flex>
        <Divider
          {...dividerProps}
          orientation="vertical"
          decorative={false}
          style={{ marginBlock: 4 }}
        />
        <Flex gap={4} role="group" aria-label="Lists">
          <IconButton
            size="s"
            variant="ghost"
            icon={ListBulletsIcon}
            aria-label="Bulleted list"
            pressed={list === 'bullets'}
            onPressedChange={(pressed) => setList(pressed ? 'bullets' : '')}
          />
          <IconButton
            size="s"
            variant="ghost"
            icon={ListNumbersIcon}
            aria-label="Numbered list"
            pressed={list === 'numbers'}
            onPressedChange={(pressed) => setList(pressed ? 'numbers' : '')}
          />
        </Flex>
      </Flex>
      <Text as="div" size="body-s" weight={bold ? 'bold' : 'regular'} italic={italic}>
        <Block style={{ margin: 0, paddingInlineStart: list ? '1.5em' : 0 }}>
          <Line>Review the draft</Line>
          <Line>Share with editors</Line>
        </Block>
      </Text>
    </Stack>
  );
}
