import { FileTextIcon } from '@phosphor-icons/react';
import { Icon, Skeleton, SkeletonText, Stack, Text } from '@docouno/unica';

export function LoadingSummary({
  loading = true,
  summary = 'Observations on quieter, more thoughtful interfaces.',
  announce = true,
  skeletonProps = {},
  textProps = {},
} = {}) {
  return (
    <Stack gap={12}>
      <article
        aria-busy={loading}
        style={{
          display: 'grid',
          gridTemplateColumns: 'var(--size-l-icon) minmax(0, 1fr)',
          alignItems: 'start',
          gap: 'var(--space-12)',
          minBlockSize: 'calc(3 * var(--text-size-body-m-lh))',
        }}
      >
        {loading ? (
          <>
            <Skeleton {...skeletonProps} width="var(--size-l-icon)" height="var(--size-l-icon)" />
            <SkeletonText {...textProps} size="body-m" lines={3} />
          </>
        ) : (
          <>
            <Icon usage="slot" icon={FileTextIcon} size="l" />
            <Text size="body-m">
              <bdi>{summary}</bdi>
            </Text>
          </>
        )}
      </article>
      <Text size="caption-l" color="muted" role={announce ? 'status' : undefined}>
        <bdi>{loading ? 'Loading the summary…' : 'Summary loaded.'}</bdi>
      </Text>
    </Stack>
  );
}
