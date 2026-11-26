import { AvatarGroup } from '@docouno/unica';
import type { ReactElement } from 'react';
import { DatePicker } from '../../../src/prototypes/date-picker/date-picker.components.proto.js';

export default function TooltipConsumerFixture(): ReactElement {
  return (
    <div style={{ maxInlineSize: 288, margin: '64px auto 0', display: 'grid', gap: 24 }}>
      <DatePicker
        label="Review date"
        defaultValue="2026-09-14"
        unavailable={['2026-09-05', '2026-09-19']}
      />
      <AvatarGroup
        label="Reviewers"
        members={[
          { id: 'design', name: 'Design reviewer' },
          { id: 'content', name: 'Content reviewer' },
        ]}
        showNames
      />
      <AvatarGroup
        label="Authors"
        members={[{ id: 'writer', name: 'Workspace writer' }]}
        showNames
      />
      <button type="button">Other action</button>
    </div>
  );
}
