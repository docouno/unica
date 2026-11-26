import type { PickerMessages } from './types.js';

export const defaultPickerMessages: PickerMessages = {
  placeholder: 'Select an option',
  searchLabel: 'Search options',
  clearSearch: 'Clear search',
  clearSelection: 'Clear selection',
  selectedValue: 'Selected value',
  readOnly: 'Read only',
  loading: 'Loading options…',
  updating: 'Updating options…',
  empty: 'No options available',
  unavailableGroup: 'Unavailable selection',
  unavailableOption: 'Unavailable option',
  removeUnavailable: 'Select to remove this unavailable choice.',
  unavailableDescription: 'This choice is no longer available.',
  noMatchesHint: 'Try a different search.',
  selectedCount: (count) => `${count} selected`,
  noMatches: (query) => `No matches for “${query}”`,
  selectionAnnouncement: (labels) => (labels.length ? labels.join(', ') : 'No selection'),
};
