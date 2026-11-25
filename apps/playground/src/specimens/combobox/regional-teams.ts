import { CloudIcon } from '@phosphor-icons/react';

export const longTeam = {
  value: 'continuity',
  label: 'International Infrastructure Continuity and Recovery',
  description: 'Cross-region escalation for critical outages',
  group: 'Operations',
  icon: CloudIcon,
};

export const regionalTeams = Object.entries({
  'central-europe': 'Central Europe',
  'north-america': 'North America',
  'asia-pacific': 'Asia Pacific',
  'south-america': 'South America',
}).map(([value, region]) => ({
  value,
  label: `${region} Incident Response`,
  group: 'Regional teams',
}));
