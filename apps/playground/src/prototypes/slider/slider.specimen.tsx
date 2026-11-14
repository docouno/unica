import { defineSpecimen } from '../../workbench/types.js';
import { NumberInput, RangeSlider, Slider } from './slider.proto.js';

export default defineSpecimen({
  id: 'slider',
  title: 'Slider, RangeSlider & NumberInput',
  group: 'Forms',
  summary: 'Continuous settings with native range inputs, numeric fields, and stable local values.',
  sections: [
    {
      id: 'values',
      title: 'Single, range & numeric',
      kind: 'matrix',
      render: () => (
        <div className="control-examples-proto">
          <Slider
            label="Reading column"
            min={600}
            max={1000}
            defaultValue={760}
            formatValue={(value) => `${value}px`}
          />
          <RangeSlider
            label="Retention window"
            min={0}
            max={180}
            defaultValue={[30, 90]}
            formatValue={(value) => `${value} days`}
          />
          <NumberInput label="Column width" min={600} max={1000} step={20} defaultValue={760} />
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Bounds & availability',
      kind: 'states',
      render: () => (
        <div className="control-examples-proto">
          <Slider label="Minimum value" defaultValue={0} />
          <Slider label="Unavailable policy" defaultValue={75} disabled />
          <NumberInput label="Minimum reached" min={1} max={10} defaultValue={1} />
          <NumberInput label="Policy-managed limit" defaultValue={90} readOnly />
        </div>
      ),
    },
    {
      id: 'preferences',
      title: 'Folio · Reading & retention',
      kind: 'context',
      render: () => (
        <div className="control-panel-proto">
          <Slider
            label="Reading column width"
            min={600}
            max={1000}
            defaultValue={760}
            formatValue={(value) => `${value}px`}
          />
          <RangeSlider
            label="Keep recent activity"
            min={0}
            max={180}
            defaultValue={[30, 90]}
            formatValue={(value) => `${value} days`}
          />
        </div>
      ),
    },
  ],
});
