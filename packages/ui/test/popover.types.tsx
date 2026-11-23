import { createRef } from 'react';
import type { JSX } from 'react';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../src/index.js';
import type {
  PopoverAlign,
  PopoverBodyProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverFooterProps,
  PopoverHeaderProps,
  PopoverProps,
  PopoverSide,
  PopoverSize,
  PopoverTitleProps,
  PopoverTriggerProps,
} from '../src/server.js';

export function popoverTypeCases(
  root: PopoverProps,
  trigger: PopoverTriggerProps,
  content: PopoverContentProps,
  header: PopoverHeaderProps,
  title: PopoverTitleProps,
  description: PopoverDescriptionProps,
  body: PopoverBodyProps,
  footer: PopoverFooterProps,
  close: PopoverCloseProps,
  size: PopoverSize,
  side: PopoverSide,
  align: PopoverAlign,
): JSX.Element {
  // @ts-expect-error The content owns the native carrier type.
  const invalidCarrier = <PopoverContent popover="manual" />;
  // @ts-expect-error The content owns the dialog role.
  const invalidRole = <PopoverContent role="menu" />;
  // @ts-expect-error Consumers cannot override the trigger's relationship to its panel.
  const invalidTarget = { popoverTarget: 'other' } satisfies PopoverTriggerProps;
  // @ts-expect-error As-child composition needs a single element that can receive a ref.
  const invalidChild = <PopoverTrigger asChild>Open</PopoverTrigger>;
  // @ts-expect-error The default trigger is a button.
  const invalidTriggerRef = <PopoverTrigger ref={createRef<HTMLAnchorElement>()} />;
  // @ts-expect-error The Close button cannot submit its ancestor form.
  const invalidClose = <PopoverClose type="submit" />;
  // @ts-expect-error The Close button owns its glyph.
  const invalidGlyph = <PopoverClose dangerouslySetInnerHTML={{ __html: 'Close' }} />;
  // @ts-expect-error Open appearance preview is not part of the component API.
  const invalidSize = <PopoverContent size="xl" previewOpen />;
  // @ts-expect-error The heading preserves heading semantics.
  const invalidHeading = <PopoverTitle as="span" />;
  void [
    invalidCarrier,
    invalidRole,
    invalidTarget,
    invalidChild,
    invalidTriggerRef,
    invalidClose,
    invalidGlyph,
    invalidSize,
    invalidHeading,
  ];

  const panel = createRef<HTMLDivElement>();
  return (
    <Popover {...root} ref={panel}>
      <PopoverTrigger {...trigger} />
      <PopoverTrigger asChild ref={createRef<HTMLAnchorElement>()}>
        <a href="/guide">Guide</a>
      </PopoverTrigger>
      <PopoverContent {...content} ref={panel} size={size} side={side} align={align}>
        <PopoverHeader {...header}>
          <PopoverTitle {...title} as="h2" ref={createRef<HTMLHeadingElement>()} />
          <PopoverDescription {...description} ref={createRef<HTMLParagraphElement>()} />
          <PopoverClose {...close} ref={createRef<HTMLButtonElement>()} />
        </PopoverHeader>
        <PopoverBody {...body} />
        <PopoverFooter {...footer} />
      </PopoverContent>
    </Popover>
  );
}
