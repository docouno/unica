import type { CSSProperties } from 'react';

export const densityClasses = {
  ordinary: 'unica-scrollbar',
  compact: 'unica-scrollbar unica-scrollbar--compact',
};

export interface PlaygroundValues {
  readonly density: keyof typeof densityClasses;
  readonly axis: 'vertical' | 'horizontal' | 'both';
  readonly height: number;
  readonly longContent: boolean;
}

export const topics = [
  ['Overview', 'A short introduction and the essentials.'],
  ['Getting started', 'Create a workspace and invite your team.'],
  ['Writing', 'Keep notes clear, useful and easy to find.'],
  ['Organizing', 'Group related pages without losing context.'],
  ['Sharing', 'Choose who can read and edit your work.'],
  ['Search', 'Find a page by its title or contents.'],
  ['Shortcuts', 'Move through common actions with a keyboard.'],
  ['Preferences', 'Make the workspace comfortable for you.'],
  ['Notifications', 'Stay informed about the changes that matter.'],
  ['History', 'Review earlier versions and restore a change.'],
  ['Importing', 'Bring existing documents into your workspace.'],
  ['Exporting', 'Keep a portable copy of your work.'],
] as const;

export const guidePath =
  'Workspace guide / Getting started / Access and permissions / Notifications / Email delivery settings';

export function scrollportStyle(axis: PlaygroundValues['axis'], height: number): CSSProperties {
  return {
    inlineSize: 'min(100%, 22rem)',
    minInlineSize: 0,
    blockSize: height,
    overflowX: axis === 'vertical' ? 'hidden' : 'auto',
    overflowY: axis === 'horizontal' ? 'hidden' : 'auto',
    overscrollBehavior: 'contain',
  };
}

export const wideContentStyle = { inlineSize: 'max-content' };
export const indexEntries = {
  vertical: topics.map(([title]) => title),
  both: topics.map(([title, description]) => `${title} — ${description}`),
};
export const indexStyle = {
  display: 'grid',
  gap: 'var(--space-8)',
  margin: 0,
  paddingInlineStart: '2em',
};

export function scrollbarPlaygroundCode({
  axis,
  density,
  height,
  longContent,
}: PlaygroundValues): string {
  const content =
    longContent && axis !== 'horizontal'
      ? `<ol style={${JSON.stringify(indexStyle)}}>
        {${JSON.stringify(indexEntries[axis])}.map(entry => <li key={entry}><bdi>{entry}</bdi></li>)}
      </ol>`
      : longContent
        ? guidePath
        : 'Guide';
  const width =
    longContent && axis !== 'vertical' ? ` style={${JSON.stringify(wideContentStyle)}}` : '';
  return `import '@docouno/unica/styles.css';

<div
  className="${densityClasses[density]}"
  tabIndex={0}
  role="region"
  aria-label="Workspace guide"
  style={${JSON.stringify(scrollportStyle(axis, height))}}
  onScroll={({ currentTarget }) => {
    console.log({ left: currentTarget.scrollLeft, top: currentTarget.scrollTop });
  }}
>
  <div${width}>
    ${content}
  </div>
</div>`;
}
