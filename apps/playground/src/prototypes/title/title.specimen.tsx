import { defineSpecimen } from '../../workbench/types.js';
import { Text } from '../text/text.proto.js';
import {
  EditorCopy,
  Example,
  longHeading,
  OverlayCopy,
  SignInCopy,
} from '../text/typography.examples.js';
import { Title } from './title.proto.js';
import type { HeadingTag, TitleSize } from './title.proto.js';

const sizes: readonly TitleSize[] = [
  'display-l',
  'display-m',
  'display-s',
  'heading-xl',
  'heading-l',
  'heading-m',
  'heading-s',
  'body-m',
];

export default defineSpecimen({
  id: 'title',
  title: 'Title',
  group: 'Typography',
  summary: 'Semantic h1–h6, independent visual sizes, and browser-native heading wraps.',
  sections: [
    {
      id: 'scale',
      title: 'Visual heading scale',
      kind: 'matrix',
      render: () => (
        <div className="type-study">
          {sizes.map((size) => (
            <Example key={size} label={size}>
              <Title as="h2" size={size} data-sample-size={size}>
                Shared ideas
              </Title>
            </Example>
          ))}
        </div>
      ),
    },
    {
      id: 'semantics',
      title: 'Semantic defaults & heading weight',
      kind: 'matrix',
      render: () => (
        <div className="type-study">
          {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as readonly HeadingTag[]).map((as) => (
            <Example key={as} label={as}>
              <Title as={as}>The next chapter</Title>
            </Example>
          ))}
          <Example label="h2 with heading-m">
            <Title as="h2" size="heading-m">
              A compact section, still a level-two heading
            </Title>
          </Example>
          {(['medium', 'semibold', 'bold'] as const).map((weight) => (
            <Example key={weight} label={weight}>
              <Title as="h2" size="heading-m" weight={weight}>
                Workspace decisions
              </Title>
            </Example>
          ))}
        </div>
      ),
    },
    {
      id: 'wrapping',
      title: 'Live wrapping & overflow priority',
      kind: 'states',
      render: () => (
        <div className="type-study">
          {(['wrap', 'nowrap', 'pretty', 'balance'] as const).map((textWrap) => (
            <Example key={textWrap} label={textWrap}>
              <div className="type-measure type-nowrap-window">
                <Title as="h2" size="heading-xl" textWrap={textWrap}>
                  {longHeading}
                </Title>
              </div>
            </Example>
          ))}
          <Example label="truncate wins over balance">
            <div className="type-measure">
              <Title as="h2" size="heading-xl" textWrap="balance" truncate>
                {longHeading}
              </Title>
            </div>
          </Example>
          <Example label="lineClamp=2 wins over truncate + nowrap">
            <div className="type-measure">
              <Title as="h2" size="heading-xl" textWrap="nowrap" truncate lineClamp={2}>
                {longHeading}
              </Title>
            </div>
          </Example>
        </div>
      ),
    },
    {
      id: 'baseline',
      title: 'Inline baseline studies',
      kind: 'states',
      render: () => (
        <div className="type-study">
          <Text size="caption-l" color="secondary">
            Native stand-ins for future Badge, Kbd, and Link components.
          </Text>
          <Title as="h2" size="heading-m" className="type-baseline">
            Release notes <span className="type-inline-badge">Updated</span>
          </Title>
          <Title as="h2" size="heading-m" className="type-baseline">
            Quick find <kbd className="type-inline-key">Ctrl K</kbd>
          </Title>
          <Title as="h2" size="heading-m" className="type-baseline">
            Read the{' '}
            <a className="type-inline-link" href="?item=text&section=reader">
              review guide
            </a>
          </Title>
          <Text size="body-s" color="secondary">
            Review the outcome, the supporting evidence, and the next step.
          </Text>
        </div>
      ),
    },
    { id: 'auth', title: 'Folio · Sign-in introduction', kind: 'context', render: SignInCopy },
    {
      id: 'editor',
      title: 'Folio · Editor, 760px maximum measure',
      kind: 'context',
      render: EditorCopy,
    },
    {
      id: 'drawer',
      title: 'Folio · 520px drawer copy',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => <OverlayCopy kind="drawer" />,
    },
    {
      id: 'modal',
      title: 'Folio · 548px invitation copy',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => <OverlayCopy kind="modal" />,
    },
  ],
});
