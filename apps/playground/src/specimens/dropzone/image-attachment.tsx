import { useEffect, useRef, useState } from 'react';
import { Dropzone, FileList, FileListItem, Stack } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ImageAttachment({ intakeProps = {} } = {}) {
  const intake = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<readonly File[]>([]);
  const [download, setDownload] = useState<{ file: File; url: string } | null>(null);
  const [image] = files;

  useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      let active = true;
      queueMicrotask(() => {
        if (active) {
          setDownload({ file: image, url });
        }
      });
      return () => {
        active = false;
        URL.revokeObjectURL(url);
      };
    }
  }, [image]);

  return (
    <Stack gap={12}>
      <Dropzone
        {...intakeProps}
        ref={intake}
        size="s"
        multiple={false}
        accept="image/png,image/jpeg"
        maxSize={10_000_000}
        aria-label="Choose an image"
        messages={{ browse: 'choose an image' }}
        value={files}
        onValueChange={setFiles}
      />
      <FileList aria-label="Selected image" emptyFocusRef={intake}>
        {image && (
          <FileListItem
            name={image.name}
            href={download?.file === image ? download.url : undefined}
            thumbnail={image}
            fileSize={image.size}
            state={{ phase: 'selected' }}
            onRemove={() => setFiles([])}
          />
        )}
      </FileList>
    </Stack>
  );
}
