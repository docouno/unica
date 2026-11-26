import { Tag, TagGroup, TooltipProvider, defineGlyph } from '@docouno/unica';
import type { TagSize } from '@docouno/unica';
import { useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

const leading = defineGlyph((props) => (
  <svg {...props} viewBox="0 0 24 24">
    <path d="M6 6h12v12H6z" fill="currentColor" />
  </svg>
));
const sizes: readonly TagSize[] = ['s', 'm', 'l'];
const fieldLabel = 'אלפאביתהבחנהתוכןארוךגרסהמלאה2026' + 'ReleaseVerificationChecklist';
const items = ['Release notes', 'Quarterly checklist', 'Shared publication'].map((label) => ({
  id: label,
  label,
  removeLabel: `Remove ${label}`,
}));

export default function TagGeometryFixture(): ReactElement {
  const [actions, setActions] = useState(0);
  const request = (): void => setActions((count) => count + 1);
  return (
    <TooltipProvider delay={0}>
      <div style={{ display: 'grid', gap: 12, padding: 24 }}>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sizes.map((size) => (
            <Tag
              key={size}
              size={size}
              data-testid={`size-${size}`}
              iconLeft={leading}
              removeLabel={`Remove size ${size}`}
              onRemove={request}
              status="info"
            >
              API
            </Tag>
          ))}
        </div>
        <TagGroup
          aria-label="Wrapping tags"
          items={items}
          onRemove={request}
          style={{ inlineSize: 190 }}
        />
        <div
          data-unica-tag-layout="field"
          data-testid="field"
          style={
            {
              '--tag-field-radius': 'var(--radius-xs)',
              display: 'flex',
              inlineSize: 184,
            } as CSSProperties
          }
        >
          <Tag
            data-testid="field-tag"
            iconLeft={leading}
            style={{ '--tag-max-width': '80px' }}
            textValue={fieldLabel}
            removeLabel={`Remove ${fieldLabel}`}
            onRemove={request}
          >
            <bdi dir="rtl">{fieldLabel}</bdi>
          </Tag>
        </div>
        <Tag loading onRemove={request} removeLabel="Remove syncing">
          Syncing
        </Tag>
        <Tag disabled loading onRemove={request} removeLabel="Remove locked">
          Locked
        </Tag>
        <div
          data-testid="tag-column"
          style={{ display: 'flex', flexDirection: 'column', width: 192 }}
        >
          <Tag data-testid="column-tag" onRemove={request} removeLabel="Remove API">
            API
          </Tag>
        </div>
        <div
          data-testid="tight-tag-column"
          style={{ display: 'flex', flexDirection: 'column', width: 120 }}
        >
          <Tag
            style={{ '--tag-max-width': '200px' }}
            onRemove={request}
            removeLabel="Remove Annual publication workflow notes"
          >
            Annual publication workflow notes
          </Tag>
        </div>
        <div data-testid="capped-tags" style={{ display: 'flex', gap: 8 }}>
          {['Capped release notes', 'Capped review checklist'].map((label) => (
            <Tag
              key={label}
              size="l"
              iconLeft={leading}
              style={{ '--tag-max-width': '56px' }}
              removeLabel={`Remove ${label}`}
              onRemove={request}
            >
              {label}
            </Tag>
          ))}
        </div>
        <span data-testid="actions">{actions}</span>
      </div>
    </TooltipProvider>
  );
}
