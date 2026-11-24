import { useEffect, useId, useState } from 'react';
import { Stack } from '@docouno/unica';
import { Dropzone, FileItem, FileList } from '../../prototypes/file-input/file-input.proto.js';
import '@docouno/unica/styles.css';

const emptyImage = { name: '', bytes: 0, url: '' };

export function ImageAttachment({ intakeProps = {} } = {}) {
  const intakeId = useId();
  const [image, setImage] = useState(emptyImage);
  const [feedback, setFeedback] = useState({
    text: 'No image selected.',
    rejected: false,
    revision: 0,
  });
  function announce(text = '', rejected = false) {
    setFeedback((previous) => ({ text, rejected, revision: previous.revision + 1 }));
  }

  useEffect(() => {
    const url = image.url;
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [image.url]);

  return (
    <Stack gap={12}>
      <Dropzone
        {...intakeProps}
        id={intakeId}
        size="s"
        multiple={false}
        accept="image/png,image/jpeg"
        browseLabel="choose an image"
        description={<bdi>One PNG or JPEG, up to 10 MB.</bdi>}
        status={feedback.rejected ? 'danger' : 'neutral'}
        message={
          <span role="status">
            <bdi dir="ltr" key={feedback.revision}>
              {feedback.text}
            </bdi>
          </span>
        }
        onFilesChange={(files) => {
          if (!files.length) {
            return;
          }
          const file = files[0];
          if (
            files.length !== 1 ||
            !file ||
            !['image/png', 'image/jpeg'].includes(file.type) ||
            file.size > 10000000
          ) {
            const retained = image.name ? ` Previous image retained: ${image.name}.` : '';
            announce(`Choose one PNG or JPEG up to 10 MB.${retained}`, true);
            return;
          }
          setImage({ name: file.name, bytes: file.size, url: URL.createObjectURL(file) });
          announce(`Selected image: ${file.name}.`);
        }}
      />
      {image.url && (
        <FileList aria-label="Selected image">
          <FileItem
            name={image.name}
            href={image.url}
            fileSize={image.bytes.toLocaleString('en') + (image.bytes === 1 ? ' byte' : ' bytes')}
            onRemove={() => {
              setImage(emptyImage);
              announce('No image selected.');
              document.getElementById(intakeId)?.querySelector('input')?.focus();
            }}
          />
        </FileList>
      )}
    </Stack>
  );
}
