import type { ReactElement } from 'react';
import { Dropzone, FileInput } from '@docouno/unica';

export default function FileNativeLabels(): ReactElement {
  return (
    <>
      <label htmlFor="compact">
        Passport <span aria-hidden="true">Visual marker</span>
      </label>
      <FileInput id="compact" name="passport" data-testid="compact" multiple showSize />
      <label id="well-label" htmlFor="well">
        <img src="/assets/empty-landscape.png" alt="Enrolment" width={24} height={16} />
      </label>
      <Dropzone id="well" messages={{ browse: 'Pick evidence' }} />
      <Dropzone id="standalone" messages={{ browse: 'Pick references' }} />
    </>
  );
}
