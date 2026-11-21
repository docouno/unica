import {
  Icon,
  IconProvider,
  defineGlyph,
  type BuiltinIconAdapterName,
  type GlyphComponent,
  type GlyphDefinition,
  type GlyphSource,
  type GlyphSvgProps,
  type IconAdapter,
  type IconAdapterRenderContext,
  type IconColor,
  type IconProps,
  type IconProviderProps,
  type IconSize,
  type IconUsage,
} from '@docouno/unica';
import { ArrowRightIcon } from '@phosphor-icons/react';
import {
  Component,
  createElement,
  createRef,
  type CSSProperties,
  type ComponentProps,
  type ComponentPropsWithRef,
  type FC,
  type ForwardRefExoticComponent,
  type ReactNode,
  type Ref,
  type RefAttributes,
  type SVGAttributes,
  type SVGProps,
} from 'react';

type SvgProps = ComponentPropsWithRef<'svg'>;

export function ProjectSvg({ children, ...props }: SvgProps) {
  return (
    <svg {...props} viewBox="0 0 32 16">
      {children}
      <path d="M0 0h32v16H0z" />
    </svg>
  );
}

export function NarrowSvg(props: {
  className?: string;
  width?: string | number;
  height?: string | number;
  ref?: Ref<SVGSVGElement>;
}) {
  return <svg {...props} viewBox="0 0 16 16" />;
}

export function FallbackGlyph({ source }: { source?: GlyphSource }) {
  return <Icon icon={source ?? ArrowRightIcon} usage="slot" size="m" />;
}

export function GenericStandaloneWrapper<G extends GlyphSource>({ icon }: { icon: G }) {
  return <Icon icon={icon} />;
}

export function GenericSlotWrapper<G extends GlyphSource>({ icon }: { icon: G }) {
  return <Icon icon={icon} usage="slot" />;
}

export function GenericIconList<G extends GlyphSource>({
  items,
}: {
  items: readonly { id: string; icon: G }[];
}) {
  return [
    ...items.map((item) => <Icon key={item.id} icon={item.icon} />),
    ...items.map((item) => <Icon key={item.id} icon={item.icon} usage="slot" />),
    ...items.map((item) => <Icon key={item.id} icon={item.icon} size="m" aria-label={item.id} />),
  ];
}

export function StyledIcon({ style }: { style?: CSSProperties }) {
  return <Icon icon={ArrowRightIcon} style={style} />;
}

declare const SvgrIcon: FC<SVGProps<SVGSVGElement>>;

interface LucideProps extends Omit<SVGAttributes<SVGSVGElement>, 'ref'> {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
  strokeWidth?: string | number;
  color?: string;
}
declare const LucideArrow: ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

interface TablerProps extends Omit<SVGAttributes<SVGSVGElement>, 'stroke' | 'ref'> {
  size?: string | number;
  stroke?: string | number;
  color?: string;
}
declare const TablerArrow: ForwardRefExoticComponent<TablerProps & RefAttributes<SVGSVGElement>>;

interface HeroProps extends SVGProps<SVGSVGElement> {
  title?: string;
  titleId?: string;
}
declare const HeroArrow: ForwardRefExoticComponent<HeroProps & RefAttributes<SVGSVGElement>>;

function OptionalGlyph({ compact, ...props }: SvgProps & { readonly compact?: boolean }) {
  return <svg {...props} viewBox={compact ? '0 0 16 16' : '0 0 32 16'} />;
}

function ModeGlyph({ mode, ...props }: SvgProps & { readonly mode?: 'outline' | 'solid' }) {
  return <svg {...props} data-mode={mode} />;
}

function ToggleGlyph({ on, ...props }: SvgProps & { readonly on?: boolean }) {
  return <svg {...props} data-on={on} />;
}

function SpriteGlyph({
  name,
  stroke,
  ...props
}: GlyphSvgProps & { readonly name?: string; readonly stroke?: string }) {
  return (
    <svg {...props} stroke={stroke}>
      <use href={`#${name ?? ''}`} />
    </svg>
  );
}

function LooseGlyph(props: SvgProps & Record<string, unknown>) {
  return <svg {...props} />;
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

function OverloadedReport(props: SvgProps & { plotType?: 'plain' }): ReactNode;
function OverloadedReport(
  props: SvgProps & { plotType: 'chart'; series: readonly number[] },
): ReactNode;
function OverloadedReport(props: SvgProps & ChartOptions): ReactNode {
  return <Report {...props} />;
}

const overloadedReport = defineGlyph(OverloadedReport);
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

export function LooseUnion({ loose }: { loose: boolean }) {
  const choice = loose ? LooseGlyph : ArrowRightIcon;
  return <Icon icon={choice} />;
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
const svgrComponent: GlyphComponent = SvgrIcon;
const svgrGlyph = defineGlyph(SvgrIcon);
const source: GlyphSource = defineGlyph(component);
const builtin: BuiltinIconAdapterName = 'phosphor';
const arrow: GlyphDefinition<typeof ArrowRightIcon> = defineGlyph(ArrowRightIcon, builtin);
const adapter: IconAdapter = (glyph: GlyphComponent, ctx: IconAdapterRenderContext) =>
  createElement(glyph, { ...ctx.inputProps, ...ctx.svgProps });
const optional = defineGlyph(OptionalGlyph, adapter);
const iconSize: IconSize = 'm';
const iconColor: IconColor = 'accent';
const iconUsage: IconUsage = 'standalone';
const providerProps: IconProviderProps = { adapter, children: null };
const svgPropsSample: GlyphSvgProps = { className: 'unica-icon', width: '16', height: '16' };
const props: IconProps = {
  icon: source,
  size: iconSize,
  color: iconColor,
  usage: iconUsage,
  ref: svgRef,
  'data-probe': 1,
};
const cssStyle: CSSProperties = { opacity: 0.5 };
const showTitle = true as boolean;
const unionCond = true as boolean;
const okSize = { size: 'm' as const };

const valid = [
  <Icon {...props} style={cssStyle} />,
  <Icon {...props} style={{ '--project-icon-ink': 'currentColor' }} />,
  <Icon
    icon={ArrowRightIcon}
    {...(unionCond ? { size: 's' as const } : { color: 'accent' as const })}
  />,
  <Icon icon={ArrowRightIcon} weight="bold" mirrored ref={svgRef} />,
  <Icon icon={arrow} weight={undefined} />,
  <Icon icon={SvgrIcon} />,
  <Icon icon={svgrGlyph} />,
  <Icon icon={LucideArrow} strokeWidth={1.5} absoluteStrokeWidth />,
  <Icon icon={TablerArrow} stroke={1.5} />,
  <Icon icon={NarrowSvg} />,
  <Icon icon={ModeGlyph} mode="solid" />,
  <Icon icon={ToggleGlyph} on />,
  <Icon icon={SpriteGlyph} name="check" stroke="currentColor" />,
  <Icon icon={brand} detail="brand" monochrome />,
  <Icon icon={OverloadedReport} />,
  <Icon icon={overloadedReport} plotType={undefined} />,
  <Icon icon={overloadedReport} plotType="chart" series={[1]} />,
  <Icon icon={report} />,
  <Icon icon={report} plotType="chart" series={[1]} />,
  <Icon icon={OptionalGlyph} compact />,
  <Icon icon={ProjectSvg}>
    <title dir="rtl" lang="en">
      Project
    </title>
  </Icon>,
  <Icon icon={ProjectSvg}>{showTitle && <title>Conditional</title>}</Icon>,
  <Icon icon={ProjectSvg}>{showTitle ? <title>Conditional</title> : null}</Icon>,
  <IconProvider {...providerProps}>
    <Icon icon={optional} compact usage="slot" />
  </IconProvider>,
];

const closed = { role: 'img', 'aria-hidden': true, 'aria-describedby': 'hint', tabIndex: 0 };
const named = { 'aria-label': 'Open' };
const badWeight = { weight: 'heavy' as const };
const badChart = { plotType: 'chart' as const };
const badBrand = { detail: 'shared' as const, monochrome: true as const };
const badSpreadObj = { icon: ArrowRightIcon, weight: 'heavy' as const };
const componentPropsCheck: ComponentProps<typeof Icon> = {
  icon: ArrowRightIcon,
  size: 'm',
  'data-check': true,
};
// @ts-expect-error key is not part of spreadable IconProps.
const spreadKey: IconProps = { icon: ArrowRightIcon, key: 'k1' };

const invalid = [
  // @ts-expect-error Spread options cannot bypass SourceOptions validation.
  <Icon icon={ArrowRightIcon} {...badWeight} />,
  // @ts-expect-error Conditional union spread cannot bypass SourceOptions validation.
  <Icon icon={ArrowRightIcon} {...(unionCond ? badWeight : okSize)} />,
  // @ts-expect-error Spread object with invalid vendor option must be rejected.
  <Icon {...badSpreadObj} />,
  // @ts-expect-error Union spread object with invalid vendor option must be rejected.
  <Icon {...(unionCond ? { icon: ArrowRightIcon, size: 'm' as const } : badSpreadObj)} />,
  // @ts-expect-error Spread chart mode still requires series.
  <Icon icon={report} {...badChart} />,
  // @ts-expect-error Conditional union chart spread still requires series.
  <Icon icon={report} {...(unionCond ? badChart : okSize)} />,
  // @ts-expect-error Spread discriminated union still enforces shared branch rules.
  <Icon icon={brand} {...badBrand} />,
  // @ts-expect-error SpriteGlyph custom string option rejects numbers.
  <Icon icon={SpriteGlyph} name={123} />,
  // @ts-expect-error Selecting the chart overload requires its series.
  <Icon icon={overloadedReport} plotType="chart" />,
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
  // @ts-expect-error ModeGlyph rejects values outside its union.
  <Icon icon={ModeGlyph} mode="ghost" />,
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
  // @ts-expect-error Heroicons title prop cannot leak into a decorative slot.
  <Icon icon={HeroArrow} usage="slot" title="Leak" />,
  // @ts-expect-error Actions belong to the owner.
  <Icon icon={arrow} onClick={() => undefined} />,
  // @ts-expect-error The source owns its viewBox.
  <Icon icon={arrow} viewBox="0 0 1 1" />,
  // @ts-expect-error Name the public Icon instead of passing vendor alt.
  <Icon icon={arrow} alt="Open" />,
  // @ts-expect-error Name the public Icon instead of passing vendor title.
  <Icon icon={HeroArrow} title="Open" />,
];

void [valid, invalid, svgrComponent, svgPropsSample, spreadKey, componentPropsCheck];
