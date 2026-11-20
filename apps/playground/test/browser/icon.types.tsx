import {
  Icon,
  IconProvider,
  defineGlyph,
  type BuiltinIconAdapterName,
  type GlyphComponent,
  type GlyphDefinition,
  type GlyphSource,
  type IconAdapter,
  type IconAdapterRenderContext,
  type IconProps,
} from '@docouno/unica';
import { ArrowRightIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Component, createElement, createRef, type ComponentPropsWithRef } from 'react';

type SvgProps = ComponentPropsWithRef<'svg'>;

export function ProjectSvg({ children, ...props }: SvgProps) {
  return (
    <svg {...props} viewBox="0 0 32 16">
      {children}
      <path d="M0 0h32v16H0z" />
    </svg>
  );
}

export function FallbackGlyph({ source }: { source?: GlyphSource }) {
  return <Icon icon={source ?? ArrowRightIcon} usage="slot" size="m" />;
}

function OptionalGlyph({ compact, ...props }: SvgProps & { readonly compact?: boolean }) {
  return <svg {...props} viewBox={compact ? '0 0 16 16' : '0 0 32 16'} />;
}

function Outline({ detail, ...svg }: SvgProps & { detail?: 'shared' | 'outline' }): ReactNode {
  return <svg {...svg} data-detail={detail} />;
}

type BrandDetail =
  { detail?: 'shared'; monochrome?: false } | { detail?: 'brand'; monochrome?: true };

function Brand({ detail, monochrome, ...svg }: SvgProps & BrandDetail): ReactNode {
  return <svg {...svg} data-detail={detail} data-monochrome={monochrome} />;
}

const brand = defineGlyph(Brand);

type ChartOptions =
  { plotType?: 'plain'; series?: never } | { plotType: 'chart'; series: readonly number[] };

function Report({ children, ...props }: SvgProps & ChartOptions): ReactNode {
  return (
    <svg>{props.plotType === 'chart' ? <title>{props.series.join(', ')}</title> : children}</svg>
  );
}

const report = defineGlyph(Report);

function Summary({ plotType, ...props }: SvgProps & { plotType?: 'plain' | 'compact' }): ReactNode {
  return <svg {...props} data-plot-type={plotType} />;
}

export function ReportChoice({ detailed }: { detailed: boolean }) {
  const choice = defineGlyph(detailed ? Report : Summary);
  // @ts-expect-error A summary has no chart mode or series.
  const chart = <Icon icon={choice} plotType="chart" series={[1]} />;
  void chart;
  return <Icon icon={choice} plotType="plain" />;
}

export function MixedSource({ useBrand }: { useBrand: boolean }) {
  const icon = useBrand ? brand : Outline;
  // @ts-expect-error Only the outline glyph accepts this value.
  const wrong = <Icon icon={icon} detail="outline" />;
  const registered = defineGlyph(useBrand ? Brand : Outline);
  // @ts-expect-error The descriptor preserves the same source choice.
  const wrongDescriptor = <Icon icon={registered} detail="outline" />;
  void [wrong, wrongDescriptor];
  return [
    <Icon key="raw" icon={icon} detail="shared" />,
    <Icon key="pinned" icon={registered} detail="shared" />,
  ];
}

function RequiresVariant({ variant }: SvgProps & { variant: string }) {
  return <svg data-variant={variant} />;
}

function HtmlGlyph(props: ComponentPropsWithRef<'button'>) {
  return <button {...props} />;
}

class ClassGlyph extends Component<SvgProps> {
  override render() {
    return <svg {...this.props} />;
  }
}

const svgRef = createRef<SVGSVGElement>();
const component: GlyphComponent = ProjectSvg;
const source: GlyphSource = defineGlyph(component);
const builtin: BuiltinIconAdapterName = 'phosphor';
const arrow: GlyphDefinition<typeof ArrowRightIcon> = defineGlyph(ArrowRightIcon, builtin);
const adapter: IconAdapter = (glyph: GlyphComponent, ctx: IconAdapterRenderContext) =>
  createElement(glyph, { ...ctx.inputProps, ...ctx.svgProps });
const optional = defineGlyph(OptionalGlyph, adapter);
const props: IconProps = { icon: source, ref: svgRef, 'data-probe': 1 };

const valid = [
  <Icon {...props} style={{ '--project-icon-ink': 'currentColor' }} />,
  <Icon icon={ArrowRightIcon} weight="bold" mirrored ref={svgRef} />,
  <Icon icon={arrow} weight={undefined} />,
  <Icon icon={brand} detail="brand" monochrome />,
  <Icon icon={report} />,
  <Icon icon={report} plotType="chart" series={[1]} />,
  <Icon icon={OptionalGlyph} compact />,
  <Icon icon={ProjectSvg}>
    <title>Project</title>
  </Icon>,
  <IconProvider adapter={adapter}>
    <Icon icon={optional} compact usage="slot" />
  </IconProvider>,
];

const closed = { role: 'img', 'aria-hidden': true, 'aria-describedby': 'hint', tabIndex: 0 };
const named = { 'aria-label': 'Open' };

const invalid = [
  // @ts-expect-error Chart mode requires its data.
  <Icon icon={report} plotType="chart" />,
  // @ts-expect-error Undefined cannot satisfy a required source option.
  <Icon icon={report} plotType="chart" series={undefined} />,
  // @ts-expect-error The shared detail does not support monochrome on Brand.
  <Icon icon={brand} detail="shared" monochrome />,
  // @ts-expect-error Phosphor weight must be inferred from icon.
  <Icon icon={ArrowRightIcon} weight="heavy" />,
  // @ts-expect-error Branding preserves the valid weight union.
  <Icon icon={arrow} weight="heavy" />,
  // @ts-expect-error Native SVG has no vendor weight.
  <Icon icon={ProjectSvg} weight="bold" />,
  // @ts-expect-error An erased source does not expose arbitrary vendor props.
  <Icon<ReturnType<typeof JSON.parse>> icon={ProjectSvg} unsupported />,
  // @ts-expect-error A class ref cannot receive the rendered SVG.
  <Icon icon={ClassGlyph} />,
  // @ts-expect-error A class is not a callable glyph source.
  defineGlyph(ClassGlyph),
  // @ts-expect-error Required vendor fields are incompatible with slots.
  <Icon icon={RequiresVariant} variant="solid" />,
  // @ts-expect-error Glyph source has an HTML root ref.
  <Icon icon={HtmlGlyph} />,
  // @ts-expect-error Icon ref points to an SVGSVGElement.
  <Icon icon={arrow} ref={createRef<HTMLButtonElement>()} />,
  // @ts-expect-error Icon owns the accessibility and focus attributes.
  <Icon icon={arrow} {...closed} />,
  // @ts-expect-error Hyphenated ARIA keys are closed even in direct JSX.
  <Icon icon={arrow} aria-describedby="hint" />,
  // @ts-expect-error A slot takes its name from the owner.
  <Icon icon={arrow} usage="slot" {...named} />,
  // @ts-expect-error A slot does not accept a title.
  <Icon icon={arrow} usage="slot">
    <title>Open</title>
  </Icon>,
  // @ts-expect-error Actions belong to the owner.
  <Icon icon={arrow} onClick={() => undefined} />,
  // @ts-expect-error The source owns its viewBox.
  <Icon icon={arrow} viewBox="0 0 1 1" />,
  // @ts-expect-error Name the public Icon instead of passing vendor alt.
  <Icon icon={arrow} alt="Open" />,
];

void valid;
void invalid;
