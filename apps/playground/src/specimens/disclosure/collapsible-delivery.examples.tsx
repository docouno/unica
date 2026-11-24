import { useId } from 'react';
import { Button, Card, Input, Stack, Text } from '@docouno/unica';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../prototypes/disclosure/disclosure.proto.js';
import { FormField } from '../../prototypes/form-field/form-field.proto.js';

export function DeliveryDetails({ collapsibleProps = {} } = {}) {
  const replyId = useId();
  return (
    <Card style={{ inlineSize: 'min(100%, 34rem)' }}>
      <Text size="body-s" color="secondary">
        <bdi>Send the digest to workspace owners every Monday.</bdi>
      </Text>
      <Collapsible {...collapsibleProps} defaultOpen>
        <CollapsibleTrigger asChild>
          <Button variant="secondary" tone="neutral" size="s">
            Delivery details
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent padded={false}>
          <Stack gap={8} style={{ paddingBlockStart: 'var(--space-12)', maxInlineSize: '23rem' }}>
            <FormField htmlFor={replyId} label="Reply-to address" size="s">
              <Input
                id={replyId}
                type="email"
                size="s"
                dir="ltr"
                defaultValue="reviews@example.com"
              />
            </FormField>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" tone="neutral" size="s" style={{ alignSelf: 'flex-start' }}>
                Close details
              </Button>
            </CollapsibleTrigger>
          </Stack>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
