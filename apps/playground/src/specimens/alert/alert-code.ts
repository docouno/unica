import { previewProps, previewText } from '../preview-code.js';
import type { AlertValues } from './alert.spec.js';
import noticeSource from './use-review-notice.ts?raw';

export function noticeOptions(values: AlertValues) {
  const hasMessage = Boolean(values.title.trim() || values.description.trim());
  const action = Boolean(values.actionLabel.trim());
  const liveRole = values.role !== 'region' && values.role !== 'none';
  const dynamic = liveRole && hasMessage;
  const unnamedRegion = values.role === 'region' && !values['aria-label'].trim();
  const role =
    unnamedRegion || (!hasMessage && liveRole)
      ? 'none'
      : values.role === 'auto'
        ? undefined
        : values.role;
  const closeName = (hasMessage || action) && values.close ? values.closeLabel.trim() : '';
  return { action, dynamic, role, closeName };
}

export function alertCode(values: AlertValues): string {
  const { action, dynamic, role: selectedRole, closeName } = noticeOptions(values);
  const regionName = values['aria-label'].trim();
  const interactive = dynamic || Boolean(closeName) || action;
  const imports = ['Alert'];
  const root = previewProps(
    {
      status: values.status,
      size: values.size,
      ...(!dynamic && selectedRole ? { role: selectedRole } : {}),
      ...(values.role === 'region' && regionName ? { 'aria-label': regionName } : {}),
    },
    { status: 'neutral', size: 'm' },
  );
  const role = dynamic
    ? ` role={publication === 0 ? 'none' : ${values.role === 'auto' ? 'undefined' : JSON.stringify(values.role)}}`
    : '';
  const icon =
    values.icon === 'editorial'
      ? ' icon={(props) => <LightbulbIcon {...props} weight="fill" />}'
      : values.icon === 'none'
        ? ' icon={false}'
        : '';
  const close = closeName
    ? ` close={<AlertClose id={focusId} aria-label=${previewText(closeName)} onClose={(event) => toggleFrom(event.currentTarget)} />}`
    : '';
  const body = [];
  if (closeName) {
    imports.push('AlertClose');
  }
  if (values.title.trim()) {
    imports.push('AlertTitle');
    body.push(
      `<AlertTitle${previewProps({ as: values.as }, { as: 'div' })}><bdi>${previewText(values.title)}</bdi></AlertTitle>`,
    );
  }
  if (values.description.trim()) {
    imports.push('AlertDescription');
    body.push(`<AlertDescription><bdi>${previewText(values.description)}</bdi></AlertDescription>`);
  }
  if (action) {
    imports.push('AlertActions');
    body.push(
      `<AlertActions><Button${closeName ? '' : ' id={focusId}'} variant="secondary" tone="neutral" size="s" onClick={(event) => toggleFrom(event.currentTarget)}><bdi>${previewText(values.actionLabel)}</bdi></Button></AlertActions>`,
    );
  }
  const message = `<Alert${dynamic ? ' key={publication}' : ''}${root}${role}${icon}${close}>\n${body.length ? body.join('\n') : '{null}'}\n</Alert>`;
  if (interactive) {
    imports.push('Button', 'Stack');
  }
  const lib = `import { ${imports.sort().join(', ')} } from '@docouno/unica';`;
  const glyph =
    values.icon === 'editorial' ? "import { LightbulbIcon } from '@phosphor-icons/react';\n" : '';
  if (!interactive) {
    return `${glyph}${lib}\n\n${message}`;
  }
  const controls = [
    ...(closeName || action ? ['shown', 'focusId', 'toggleFrom'] : []),
    ...(dynamic ? ['publication', 'publish'] : []),
  ];
  const restore =
    closeName || action
      ? `
    if (!shown) return (
      <Button id={focusId} variant="secondary" tone="accent" onClick={(event) => toggleFrom(event.currentTarget)}>Restore alert</Button>
    );`
      : '';
  const publish = dynamic
    ? '<div><Button size="s" variant="ghost" tone="neutral" onClick={publish}>Show feedback</Button></div>'
    : '';
  return `${glyph}${lib}
${noticeSource}
export function ReviewNotice() {
  const { ${controls.join(', ')} } = useReviewNotice();${restore}
  return <Stack gap={8}>${message}${publish}</Stack>;
}`;
}
