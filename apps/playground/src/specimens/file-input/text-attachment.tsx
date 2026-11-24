import { useRef, useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { FileInput } from '../../prototypes/file-input/file-input.proto.js';
import '@docouno/unica/styles.css';

const empty = { name: '', detail: '', text: '' };

export function TextAttachment({ fieldProps = {} } = {}) {
  const [selected, setSelected] = useState(empty);
  const [feedback, setFeedback] = useState({ text: '', rejected: false, revision: 0 });
  const latest = useRef(0);
  function announce(text = '', rejected = false) {
    setFeedback((prior) => ({ text, rejected, revision: prior.revision + 1 }));
  }
  return (
    <Stack gap={12}>
      <FileInput
        {...fieldProps}
        label="Text attachment"
        accept=".txt"
        fileName={selected.name}
        fileDetail={selected.detail}
        description={<bdi>Preview one UTF-8 text file (.txt), up to 4 KB.</bdi>}
        status={feedback.rejected ? 'danger' : 'neutral'}
        message={
          <span role="status">
            <bdi key={feedback.revision}>{feedback.text}</bdi>
          </span>
        }
        onFilesChange={(files) => {
          const request = ++latest.current;
          const file = files[0];
          if (!file) {
            setSelected(empty);
            announce('Preview cleared.');
            return;
          }
          if (files.length !== 1 || !/\.txt$/i.test(file.name) || file.size > 4000) {
            announce('Choose one .txt file up to 4 KB.', true);
            return;
          }
          announce('Reading the file…');
          void file.text().then(
            (text) => {
              if (request === latest.current) {
                setSelected({
                  name: file.name,
                  detail: file.size + (file.size === 1 ? ' byte' : ' bytes'),
                  text,
                });
                announce(text ? 'File preview ready.' : 'The selected file is empty.');
              }
            },
            () => {
              if (request === latest.current) {
                announce('The file could not be read. Choose it again.', true);
              }
            },
          );
        }}
      />
      {selected.text && (
        <Text
          as="p"
          dir="auto"
          size="body-s"
          style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {selected.text}
        </Text>
      )}
    </Stack>
  );
}
