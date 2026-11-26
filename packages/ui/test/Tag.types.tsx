import { createRef } from 'react';
import type { ReactElement } from 'react';
import { Tag, TagGroup, defineGlyph } from '../src/index.js';
import type {
  TagGroupItem,
  TagGroupMessages,
  TagGroupProps,
  TagProps,
  TagSize,
  TagStatus,
} from '../src/index.js';
import type * as Server from '../src/server.js';

const ignore = (): void => {};
const glyph = defineGlyph(() => null);
const size: Server.TagSize = 's' satisfies TagSize;
const status: Server.TagStatus = 'danger' satisfies TagStatus;
const item: Server.TagGroupItem = {
  id: 'version',
  label: <bdi dir="rtl">גירסה 2</bdi>,
  textValue: 'גירסה 2',
  removeLabel: 'Remove גירסה 2',
  removeIcon: glyph,
  status,
} satisfies TagGroupItem;
const messages: Partial<Server.TagGroupMessages> = {
  removed: (labels) => labels.join(' · '),
} satisfies Partial<TagGroupMessages>;
const group: Server.TagGroupProps = {
  items: [item],
  'aria-labelledby': 'assigned-labels',
  size,
  onRemove: ignore,
  messages,
  style: { '--tag-group-gap': '6px' },
  ref: createRef<HTMLDivElement>(),
  emptyFocusRef: createRef<HTMLButtonElement>(),
  maxVisible: undefined,
} satisfies TagGroupProps;
const tag: Server.TagProps = {
  children: 'Release',
  onRemove: ignore,
  removeLabel: 'Remove Release',
  ref: createRef<HTMLSpanElement>(),
  removeRef: createRef<HTMLButtonElement>(),
  removeTabIndex: -1,
  iconLeft: glyph,
  style: { '--tag-max-width': '140px' },
  loading: undefined,
} satisfies TagProps;

export function TagExamples(): ReactElement {
  return (
    <>
      <h3 id="assigned-labels">Assigned labels</h3>
      <Tag {...tag} />
      <Tag {...tag} textValue="Release preview" removeRef={() => () => undefined}>
        <em>Release preview</em>
      </Tag>
      <TagGroup {...group} />
    </>
  );
}

// @ts-expect-error The trailing button requires a complete accessible action name.
export const unnamed = <Tag onRemove={ignore}>Release</Tag>;
// @ts-expect-error The owner must receive the removal request.
export const noHandler = <Tag removeLabel="Remove Release">Release</Tag>;
export const noEquivalent = (
  // @ts-expect-error Rich content requires a plain text equivalent.
  <Tag removeLabel="Remove Release" onRemove={ignore}>
    <b>Release</b>
  </Tag>
);
// @ts-expect-error The passive root does not accept an activation handler.
export const clickableRoot = <Tag {...tag} onClick={ignore} />;
// @ts-expect-error The passive root cannot take a tab stop.
export const focusableRoot = <Tag {...tag} tabIndex={0} />;
// @ts-expect-error The nested native action accepts only normal or programmatic focus.
export const positiveTabIndex = <Tag {...tag} removeTabIndex={1} />;
// @ts-expect-error Preview states belong to the example harness.
export const preview = <Tag {...tag} previewState="active" />;
// @ts-expect-error The component owns the marker palette attribute.
export const presetMarker: TagProps = { ...tag, 'data-unica-mark-status': 'info' };
// @ts-expect-error Tag has no decorative material variant.
export const appearance = <Tag {...tag} appearance="glass" />;
// @ts-expect-error Collection naming is required.
export const unnamedGroup = <TagGroup items={[]} onRemove={ignore} />;
// @ts-expect-error The toolbar always follows horizontal navigation.
export const verticalGroup = <TagGroup {...group} aria-orientation="vertical" />;
// @ts-expect-error The group disables individual actions, including native fieldset behavior.
export const disabledToolbar = <TagGroup {...group} aria-disabled="true" />;
// @ts-expect-error Use hidden or inert to remove the native actions from keyboard interaction.
export const hiddenToolbar = <TagGroup {...group} aria-hidden />;
// @ts-expect-error The native remove action must stay exposed while in the keyboard order.
export const hiddenTag = <Tag {...tag} aria-hidden />;
// @ts-expect-error Collection labels follow the same plain text equivalent contract.
export const noItemEquivalent: TagGroupItem = {
  id: 'r',
  label: <b>Release</b>,
  removeLabel: 'Remove Release',
};
// @ts-expect-error Collection contents are always controlled.
export const defaultItems = <TagGroup {...group} defaultItems={[item]} />;
