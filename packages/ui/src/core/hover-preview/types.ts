export interface HoverPreviewChangeDetails {
  readonly reason:
    | 'hover'
    | 'focus'
    | 'leave'
    | 'tab'
    | 'escape'
    | 'activation'
    | 'outside-press'
    | 'replacement'
    | 'unavailable'
    | 'native';
  readonly originalEvent?: Event | undefined;
}

export interface PreviewOpenProps {
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean, details: HoverPreviewChangeDetails) => void) | undefined;
}
