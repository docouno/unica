import { Container } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { choiceProp, spacingOptions, viewportNote } from './layout.options.js';
import './layout.examples.css';

const sizeOptions = {
  s: 's',
  m: 'm',
  l: 'l',
  'Mobile s · Desktop m · Wide l': { mobile: 's', desktop: 'm', wide: 'l' },
} as const;

function DocumentSummary() {
  return (
    <section>
      <h2>Release notes</h2>
      <p>Review changes to the publishing workflow.</p>
    </section>
  );
}

export default defineComponent({
  id: 'container',
  title: 'Container',
  category: 'Layout',
  status: 'UI',
  summary: 'A fluid content column with a maximum width and logical gutters. ' + viewportNote,
  props: {
    size: choiceProp(sizeOptions, 'm', 'Widths for s, m, and l are 720, 960, and 1280 px.'),
    gutter: choiceProp(spacingOptions, 'Default', 'Inline padding. Defaults to 16.'),
    centered: {
      kind: 'boolean',
      group: 'Layout',
      default: true,
      description: 'Center the column when space is available. False aligns it to inline start.',
    },
  },
  render: ({ ctx, values }) => (
    <div className="layout-example layout-container-frame">
      <Container
        {...ctx.subject}
        size={values.size === 'm' ? undefined : sizeOptions[values.size]}
        gutter={spacingOptions[values.gutter]}
        centered={values.centered}
      >
        <span className="layout-demo-tile">Document content</span>
      </Container>
    </div>
  ),
  code: (_, attributes) => `<Container${attributes}>
  <span>Document content</span>
</Container>`,
  matrixViews: [
    {
      id: 'size-alignment',
      title: 'Centered widths',
      caption: 'Use a 1440 px artboard in one theme to compare the width limits.',
      group: 'size',
      fixed: { centered: true },
    },
    {
      id: 'inline-start-widths',
      title: 'Widths at inline start',
      caption: 'Use a 1440 px artboard in one theme to see the free space at inline end.',
      group: 'size',
      fixed: { centered: false },
    },
  ],
  cases: [
    {
      id: 'rtl-alignment',
      title: 'Inline start in RTL',
      kind: 'behavior',
      caption:
        'At widths above 720 px, the first container sits on the right and the second stays centered.',
      render: ({ ctx }) => (
        <div className="layout-cases" dir="rtl">
          <div className="layout-example layout-container-frame">
            <Container {...ctx.subject} size="s" centered={false}>
              <span className="layout-demo-tile">Inline start</span>
            </Container>
          </div>
          <div className="layout-example layout-container-frame">
            <Container size="s" className="layout-outline">
              <span className="layout-demo-tile">Centered</span>
            </Container>
          </div>
        </div>
      ),
    },
    {
      id: 'narrow-gutter',
      title: 'Fluid width with a fixed gutter',
      kind: 'content',
      width: 360,
      render: ({ ctx }) => (
        <div className="layout-example layout-container-frame">
          <Container {...ctx.subject} size="l" gutter={16}>
            <span className="layout-demo-tile">The gutter sits inside the column.</span>
          </Container>
        </div>
      ),
    },
  ],
  usage: [
    {
      id: 'document',
      title: 'A bounded document column',
      render: ({ ctx }) => (
        <div className="layout-example layout-container-frame">
          <Container {...ctx.subject} size="s" gutter={{ mobile: 8, tablet: 24 }}>
            <DocumentSummary />
          </Container>
        </div>
      ),
      code: `import '@docouno/unica/styles.css';
import { Container } from '@docouno/unica';

<Container size="s" gutter={{ mobile: 8, tablet: 24 }}>
  <section>
    <h2>Release notes</h2>
    <p>Review changes to the publishing workflow.</p>
  </section>
</Container>`,
    },
  ],
});
