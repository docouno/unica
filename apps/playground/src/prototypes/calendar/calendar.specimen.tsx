import { defineSpecimen } from '../../workbench/types.js';
import { Calendar, DatePicker, DateRangePicker } from './calendar.proto.js';
import { PopoverContent } from '../popover/popover.proto.js';
import '../input/input.css';

export default defineSpecimen({
  id: 'calendar',
  title: 'Calendar & Date pickers',
  group: 'Forms',
  summary: 'September collection filters and January review dates, with real local day selection.',
  sections: [
    {
      id: 'dates',
      title: 'Date & range fields',
      kind: 'matrix',
      render: () => (
        <div className="control-examples-proto">
          <DatePicker label="Review due" defaultValue="2027-01-15" clearable />
          <DateRangePicker label="Modified between" defaultValue={['2026-09-14', '2026-09-17']} />
          <DatePicker label="Inline review date" variant="ghost" defaultValue="2027-01-15" />
        </div>
      ),
    },
    {
      id: 'calendar',
      title: 'Selection, ranges & availability',
      kind: 'states',
      surface: 'overlay',
      overlayStage: true,
      render: () => (
        <div className="control-examples-proto">
          <PopoverContent aria-label="Single date preview">
            <Calendar month="2027-01" defaultSelected={15} />
          </PopoverContent>
          <PopoverContent aria-label="Date range preview">
            <Calendar month="2026-09" range={[14, 17]} />
          </PopoverContent>
          <DatePicker label="Policy-managed date" disabled defaultValue="2027-01-15" />
        </div>
      ),
    },
    {
      id: 'collection',
      title: 'Folio · Collection date filter',
      kind: 'context',
      render: () => (
        <div className="calendar-specimen-stage-proto">
          <DateRangePicker
            label="Last modified"
            defaultOpen
            defaultValue={['2026-09-14', '2026-09-17']}
            style={{ maxWidth: '20rem' }}
          />
        </div>
      ),
    },
  ],
});
