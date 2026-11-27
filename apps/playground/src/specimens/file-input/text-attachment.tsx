import { useRef, useState } from 'react';
import { FileInput, FormField, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function TextAttachment({ fieldProps = {} } = {}) {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [unreadable, setUnreadable] = useState(false);
  const latest = useRef(0);

  return (
    <Stack gap={12}>
      <FormField
        label="Text attachment"
        description="Preview the contents of a UTF-8 text attachment."
        status={unreadable ? 'danger' : 'neutral'}
        message={<span role="status">{feedback}</span>}
      >
        <FileInput
          {...fieldProps}
          accept=".txt"
          maxSize={4000}
          showSize
          onValueChange={([file]) => {
            const request = ++latest.current;
            setUnreadable(false);
            setText('');
            setFeedback(file ? 'Reading the file…' : '');
            if (!file) {
              return;
            }
            void file.text().then(
              (content) => {
                if (request === latest.current) {
                  setText(content);
                  setFeedback(content ? 'File preview ready.' : 'The selected file is empty.');
                }
              },
              () => {
                if (request === latest.current) {
                  setUnreadable(true);
                  setFeedback('The file could not be read. Choose it again.');
                }
              },
            );
          }}
        />
      </FormField>
      {text && (
        <Text
          as="p"
          dir="auto"
          size="body-s"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {text}
        </Text>
      )}
    </Stack>
  );
}
