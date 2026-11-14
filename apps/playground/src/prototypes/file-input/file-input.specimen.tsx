import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Dropzone, FileInput, FileItem, FileList } from './file-input.proto.js';

function ImportExample(): ReactElement {
  const [names, setNames] = useState<readonly string[]>([
    'platform-runbooks-2026-q3.zip',
    'architecture-decisions.zip',
  ]);
  return (
    <div className="control-stack-proto">
      <Dropzone
        onFilesChange={(files) =>
          setNames([...new Set([...names, ...files.map((file) => file.name)])])
        }
      />
      <FileList>
        {names.map((name, index) => (
          <FileItem
            key={name}
            name={name}
            detail={
              index === 0 ? '18.2 MB · Uploading & indexing archive…' : '6.4 MB · Ready to validate'
            }
            status={index === 0 ? 'uploading' : 'neutral'}
            progress={index === 0 ? 65 : undefined}
            onRemove={() => setNames(names.filter((item) => item !== name))}
          />
        ))}
      </FileList>
    </div>
  );
}

export default defineSpecimen({
  id: 'file-input',
  title: 'FileInput & Dropzone',
  group: 'Forms',
  summary:
    'Local file selection and a visible import queue. Files never leave the browser preview.',
  sections: [
    {
      id: 'receiving',
      title: 'Compact field & drop surface',
      kind: 'matrix',
      render: () => (
        <div className="control-examples-proto">
          <FileInput
            label="Schema mapping"
            initialFileName="frontmatter-schema.json"
            accept=".json,.yaml,.yml"
            description="JSON or YAML schema · 18.4 KB sample"
          />
          <Dropzone />
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Availability & validation',
      kind: 'states',
      render: () => (
        <div className="control-examples-proto">
          <FileInput label="Workspace policy" initialFileName="managed-schema.json" disabled />
          <FileList>
            <FileItem
              name="verified-runbooks.zip"
              detail="Zero broken cross-references."
              status="success"
            />
            <FileItem
              name="unmapped-pages.zip"
              detail="3 pages need an owner mapping."
              status="danger"
            />
          </FileList>
        </div>
      ),
    },
    {
      id: 'import',
      title: 'Folio · Archive import',
      kind: 'context',
      render: () => <ImportExample />,
    },
  ],
});
