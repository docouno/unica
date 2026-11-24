import { useId, useRef, useState } from 'react';
import { Button, Flex, RangeSlider, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function PriceFilter({ rangeProps = {} } = {}) {
  const id = useId();
  const focusMinimum = useRef(() => {
    // The lower thumb supplies its focus action when mounted.
  });
  const submissionCount = useRef(0);
  const [submitted, setSubmitted] = useState('');
  return (
    <Stack gap={12}>
      <Text as="span" id={id + '-label'} size="body-m">
        Price range
      </Text>
      <RangeSlider
        {...rangeProps}
        aria-labelledby={id + '-label'}
        aria-describedby={id + '-help'}
        thumbLabels={['Minimum price', 'Maximum price']}
        names={['from', 'to']}
        inputRefs={[
          (input) => {
            focusMinimum.current = () => input?.focus();
          },
          null,
        ]}
        form={id}
        defaultValue={[25, 75]}
        formatValue={(price) => '$' + price}
      />
      <Text as="p" id={id + '-help'} size="caption-l" color="secondary">
        <bdi>Both prices are inclusive.</bdi>
      </Text>
      <form
        id={id}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const from = data.get('from');
          const to = data.get('to');
          if (typeof from === 'string' && typeof to === 'string') {
            submissionCount.current += 1;
            setSubmitted('$' + from + ' — $' + to);
          }
        }}
        onReset={(event) => {
          const reset = event.nativeEvent;
          const countAtReset = submissionCount.current;
          // A keyboard reset can reach document listeners after the microtask checkpoint.
          setTimeout(() => {
            if (!reset.defaultPrevented && submissionCount.current === countAtReset) {
              setSubmitted('');
            }
          }, 0);
        }}
      >
        <Flex gap={8} wrap="wrap">
          <Button size="s" type="submit">
            Apply price filter
          </Button>
          <Button size="s" type="reset" variant="secondary">
            Reset
          </Button>
        </Flex>
      </form>
      <Flex gap={8} wrap="wrap" align="center">
        <Text as="p" role="status" size="caption-l" color="secondary">
          {submitted && (
            <bdi>
              Applied price range: <bdi dir="ltr">{submitted}</bdi>.
            </bdi>
          )}
        </Text>
        {submitted && (
          <Button type="button" size="s" variant="ghost" onClick={() => focusMinimum.current()}>
            Edit price range
          </Button>
        )}
      </Flex>
    </Stack>
  );
}
