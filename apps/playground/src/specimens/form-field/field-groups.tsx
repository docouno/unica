import { useId, useState } from 'react';
import {
  Checkbox,
  CheckboxCard,
  CheckboxCardGroup,
  CheckboxGroup,
  FormField,
  Radio,
  RadioGroup,
  Switch,
  SwitchGroup,
  Stack,
  Text,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

const sizes = Object.freeze({ compact: 's', regular: 'm', comfortable: 'l' });

export function Groups({ fieldProps = {} } = {}) {
  const id = useId();
  const [missing, setMissing] = useState({ s: true, m: true, l: true });
  return (
    <Stack gap={24}>
      {Object.entries(sizes).map(([density, size]) => (
        <Stack gap={12} key={size}>
          <Text as="p" size="caption-l" color="secondary">
            <bdi>
              {size.toUpperCase()} · {density}
            </bdi>
          </Text>
          <FormField
            {...fieldProps}
            size={size}
            orientation="horizontal"
            target="group"
            label="Send updates"
            description={<bdi>Choose at least one way to receive updates.</bdi>}
            message={missing[size] ? <bdi>Select a delivery method.</bdi> : undefined}
            status={missing[size] ? 'danger' : 'neutral'}
            required
          >
            <CheckboxGroup
              ref={(group) => {
                const owner = group?.querySelector('input')?.form;
                if (!group || !owner) {
                  return;
                }
                const binding = new AbortController();
                owner.addEventListener(
                  'reset',
                  (event) => {
                    // Read the group after the browser applies an uncanceled reset.
                    setTimeout(() => {
                      if (!event.defaultPrevented && group.isConnected) {
                        const empty = !group.querySelector('input:checked');
                        setMissing((current) =>
                          current[size] === empty ? current : { ...current, [size]: empty },
                        );
                      }
                    }, 0);
                  },
                  { signal: binding.signal },
                );
                return () => binding.abort();
              }}
              requiredMessage="Select a delivery method."
              onValueChange={(values) =>
                setMissing((current) => ({ ...current, [size]: !values.length }))
              }
              name={`${id}-${size}-delivery`}
            >
              <Checkbox value="email" label="Email digest" />
              <Checkbox
                value="in-app"
                label="In-app notifications"
                description={<bdi>Quiet updates inside your workspace.</bdi>}
              />
            </CheckboxGroup>
          </FormField>
        </Stack>
      ))}
      <FormField
        {...fieldProps}
        orientation="horizontal"
        target="group"
        label="Default access"
        description={<bdi>Applies to newly shared documents.</bdi>}
      >
        <RadioGroup name={`${id}-access`} defaultValue="read">
          <Radio value="read" label="Can view" />
          <Radio
            value="edit"
            label="Can edit"
            description={<bdi>Includes publishing changes.</bdi>}
          />
        </RadioGroup>
      </FormField>
      <FormField
        {...fieldProps}
        orientation="horizontal"
        target="group"
        label="Notifications"
        description={<bdi>Each setting takes effect independently.</bdi>}
      >
        <SwitchGroup>
          <Switch label="Mentions" defaultChecked />
          <Switch label="Weekly summary" />
        </SwitchGroup>
      </FormField>
      <FormField
        {...fieldProps}
        orientation="horizontal"
        target="group"
        label="Include in search"
        labelAlign="start"
        description={<bdi>Select the sources people can discover.</bdi>}
      >
        <CheckboxCardGroup name={`${id}-sources`} defaultValue={['published']}>
          <CheckboxCard
            value="published"
            label="Published documents"
            description={<bdi>Reviewed and ready to share.</bdi>}
          />
          <CheckboxCard
            value="drafts"
            label="Working drafts"
            description={<bdi>Still open for feedback.</bdi>}
          />
        </CheckboxCardGroup>
      </FormField>
    </Stack>
  );
}
