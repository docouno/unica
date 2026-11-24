import { useId, useState } from 'react';
import { Box, Checkbox, CheckboxGroup, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

const available = ['notes', 'images', 'files'];

export function ExportSelection({ groupProps = {} } = {}) {
  const [selected, setSelected] = useState(['notes']);
  const metadataId = useId();
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 26rem)' }}>
      <Stack gap={4}>
        <Checkbox
          label="Select all available items"
          checked={selected.length === available.length}
          indeterminate={selected.length > 0 && selected.length < available.length}
          onCheckedChange={(checked) => setSelected(checked ? available : [])}
        />
        <Box paddingInlineStart={24}>
          <CheckboxGroup
            {...groupProps}
            aria-label="Available items"
            value={selected}
            onValueChange={setSelected}
          >
            <Checkbox value="notes" label="Notes" />
            <Checkbox value="images" label="Images" />
            <Checkbox value="files" label="Attachments" />
            <Checkbox
              value="archive"
              label="Archived items"
              description={<bdi>Restore these items before selecting them.</bdi>}
              disabled
            />
          </CheckboxGroup>
        </Box>
        <Text role="status" size="caption-l" color="secondary">
          <bdi>
            {selected.length} of {available.length} available items selected
          </bdi>
        </Text>
      </Stack>
      <Stack gap={4}>
        <Text id={metadataId} size="body-s" weight="medium">
          Include metadata
        </Text>
        <CheckboxGroup
          aria-labelledby={metadataId}
          orientation="horizontal"
          defaultValue={['dates']}
        >
          <Checkbox value="dates" label="Dates" />
          <Checkbox value="authors" label="Authors" />
          <Checkbox value="tags" label="Tags" />
        </CheckboxGroup>
      </Stack>
    </Stack>
  );
}
