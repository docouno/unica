import { Link, SkeletonText, Text } from '@docouno/unica';

export const supportedScales = (
  <>
    <Text size="body-xs">Compact text</Text>
    <Link href="/guide" size="caption-s">
      Guide
    </Link>
    <Link href="/guide" size="inherit">
      Guide
    </Link>
    <SkeletonText size="display-l" />
    <SkeletonText size="caption-s" />
  </>
);

export const unsupportedScales = [
  // @ts-expect-error Link keeps its own scale.
  <Link href="/guide" size="body-xs">
    Guide
  </Link>,
  // @ts-expect-error SkeletonText keeps its original thirteen sizes.
  <SkeletonText size="body-xs" />,
];
