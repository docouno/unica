import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@docouno/unica/styles.css';
import type { ReactElement } from 'react';
import { THEME_PRESETS } from '@docouno/unica';
import { OverlayStage } from './workbench/WorkbenchApp.js';
import './unica.workbench.css';
import type {
  SceneDefinition,
  SpecimenDefinition,
  WorkbenchConfig,
  WorkbenchEmptyContext,
  WorkbenchStageContext,
} from './workbench/types.js';

interface SpecimenModule {
  readonly default: SpecimenDefinition;
}

interface SceneModule {
  readonly default: SceneDefinition;
}

const specimenModules = import.meta.glob<SpecimenModule>('./prototypes/**/*.specimen.tsx', {
  eager: true,
});

const sceneModules = import.meta.glob<SceneModule>('./scenes/**/*.scene.tsx', {
  eager: true,
});

const specimens: readonly SpecimenDefinition[] = Object.values(specimenModules)
  .map((m) => m.default)
  .sort((a, b) => a.title.localeCompare(b.title));

const scenes: readonly SceneDefinition[] = Object.values(sceneModules)
  .map((m) => m.default)
  .sort((a, b) => a.id.localeCompare(b.id));

export function UnicaUnderlay(): ReactElement {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--bg-canvas)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 'var(--surface-s-radius)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-soft-bg)',
              color: 'var(--accent-soft-fg)',
              fontSize: 'var(--text-size-caption-l)',
              fontWeight: 600,
            }}
          >
            Folio · Production
          </span>
          <span style={{ color: 'var(--fg-secondary)', fontSize: 'var(--text-size-caption-l)' }}>
            Release pipeline · v2.4.0
          </span>
        </div>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--status-success-soft-bg)',
            color: 'var(--status-success-soft-fg)',
            fontSize: 'var(--text-size-caption-m)',
            fontWeight: 600,
          }}
        >
          Healthy · 99.98%
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--surface-m-radius)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '55%',
              height: '10px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--accent-solid)',
              opacity: 0.75,
            }}
          />
          <div
            style={{
              width: '85%',
              height: '8px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--border-strong)',
              opacity: 0.55,
            }}
          />
          <div
            style={{
              width: '70%',
              height: '8px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--border-default)',
            }}
          />
        </div>
        <div
          style={{
            padding: '14px',
            borderRadius: 'var(--surface-m-radius)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '48%',
              height: '10px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--status-warning-solid)',
              opacity: 0.8,
            }}
          />
          <div
            style={{
              width: '90%',
              height: '8px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--border-strong)',
              opacity: 0.55,
            }}
          />
          <div
            style={{
              width: '62%',
              height: '8px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--border-default)',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.5fr 1fr',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: 'var(--surface-s-radius)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            height: '12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-solid)',
            opacity: 0.85,
          }}
        />
        <div
          style={{
            height: '12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--status-success-solid)',
            opacity: 0.8,
          }}
        />
        <div
          style={{
            height: '12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--status-warning-solid)',
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  );
}

function renderUnicaEmptyState({ theme, surface }: WorkbenchEmptyContext): ReactElement {
  const isOverlay = surface === 'overlay';
  return (
    <div
      style={{
        width: '100%',
        padding: '18px',
        borderRadius: 'var(--surface-m-radius)',
        border: '1px solid var(--border-default)',
        backgroundColor: isOverlay ? 'var(--bg-overlay)' : 'var(--bg-surface)',
        backgroundImage: 'var(--motif-corner-ticks)',
        backdropFilter: isOverlay ? 'var(--overlay-backdrop)' : 'none',
        boxShadow: isOverlay
          ? 'var(--overlay-rim), var(--overlay-shadow-popover)'
          : 'var(--surface-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              fontSize: 'var(--text-size-heading-s)',
              lineHeight: 'var(--text-size-heading-s-lh)',
              fontWeight: 650,
              color: 'var(--fg-primary)',
            }}
          >
            {theme.label}
          </span>
          <span style={{ fontSize: 'var(--text-size-caption-l)', color: 'var(--fg-muted)' }}>
            Ready for component specimens (<code>src/prototypes/</code>) and Folio scenes (
            <code>src/scenes/</code>)
          </span>
        </div>
        <span
          style={{
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            border: 'var(--pill-border-width) solid var(--accent-border)',
            background: 'var(--accent-soft-bg)',
            color: 'var(--accent-soft-fg)',
            fontSize: 'var(--text-size-caption-m)',
            fontWeight: 600,
          }}
        >
          {surface}
        </span>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}
      >
        {(
          [
            ['shell', 'var(--bg-shell)'],
            ['aside', 'var(--bg-aside)'],
            ['canvas', 'var(--bg-canvas)'],
            ['surface', 'var(--bg-surface)'],
            ['raised', 'var(--bg-surface-raised)'],
          ] as const
        ).map(([name, bg]) => (
          <div
            key={name}
            style={{
              padding: '8px',
              borderRadius: 'var(--size-s-radius)',
              border: '1px solid var(--border-subtle)',
              background: bg,
              fontSize: 'var(--text-size-caption-m)',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--fg-secondary)',
            }}
          >
            {name}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {(
          [
            ['accent', 'var(--accent-solid)', 'var(--fg-on-accent)'],
            ['info', 'var(--status-info-soft-bg)', 'var(--status-info-soft-fg)'],
            ['success', 'var(--status-success-soft-bg)', 'var(--status-success-soft-fg)'],
            ['warning', 'var(--status-warning-soft-bg)', 'var(--status-warning-soft-fg)'],
            ['danger', 'var(--status-danger-soft-bg)', 'var(--status-danger-soft-fg)'],
          ] as const
        ).map(([label, bg, fg]) => (
          <span
            key={label}
            style={{
              padding: '3px 9px',
              borderRadius: 'var(--size-s-radius)',
              background: bg,
              color: fg,
              fontSize: 'var(--text-size-caption-l)',
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function renderUnicaStage({
  surface,
  overlayStage,
  children,
}: WorkbenchStageContext): ReactElement {
  if (!overlayStage && surface !== 'overlay') {
    return <>{children}</>;
  }
  return (
    <OverlayStage underlay={<UnicaUnderlay />} minHeight={320}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--scrim-bg)',
          pointerEvents: 'none',
        }}
      />
      <div
        data-surface="overlay"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </OverlayStage>
  );
}

export const unicaWorkbench: WorkbenchConfig = {
  title: 'Unica Workbench',
  subtitle: '6 presets',
  themes: THEME_PRESETS,
  defaultThemeId: 'frost-dark',
  specimens,
  scenes,
  renderStage: renderUnicaStage,
  renderEmptyState: renderUnicaEmptyState,
};
