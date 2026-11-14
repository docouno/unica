import { defineSpecimen } from '../../workbench/types.js';
import { Textarea } from './textarea.proto.js';

export default defineSpecimen({
  id: 'textarea',
  title: 'Textarea',
  group: 'Forms',
  summary: 'A calm multiline field for page summaries, access notes, and review context.',
  sections: [
    {
      id: 'roles',
      title: 'Form slot & inline prose',
      kind: 'matrix',
      render: () => (
        <div className="control-examples-proto">
          <Textarea
            label="Summary"
            defaultValue="Operational procedure for promoting a synchronous standby replica during hardware degradation."
          />
          <Textarea
            label="Inline description"
            variant="ghost"
            defaultValue="Add context for the next reviewer…"
          />
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Availability & feedback',
      kind: 'states',
      render: () => (
        <div className="control-examples-proto">
          <Textarea
            label="Review note"
            status="danger"
            message="Add the rollback procedure before requesting review."
            placeholder="Describe the rollback procedure"
          />
          <Textarea
            label="Policy summary"
            readOnly
            defaultValue="Quarterly verification is required for all Tier-0 documents."
          />
          <Textarea
            label="Unavailable note"
            disabled
            defaultValue="This note is managed by the workspace policy."
          />
        </div>
      ),
    },
    {
      id: 'properties',
      title: 'Folio · Page summary',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => (
        <Textarea
          label="Description"
          rows={3}
          defaultValue="Operational procedure for promoting a synchronous standby replica during primary hardware degradation without dropping pooled transactions."
          description="Visible in collection cards and search results."
        />
      ),
    },
  ],
});
