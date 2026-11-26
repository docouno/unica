import { useId, useState } from 'react';
import {
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Switch,
  SwitchGroup,
  Stack,
  Text,
  CheckboxCard,
  CheckboxCardGroup,
} from '@docouno/unica';
import { FormField } from '../../prototypes/form-field/form-field.proto.js';
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
            labelId={`${id}-${size}-label`}
            description={<bdi>Choose at least one way to receive updates.</bdi>}
            descriptionId={`${id}-${size}-description`}
            message={missing[size] ? <bdi>Select a delivery method.</bdi> : undefined}
            messageId={missing[size] ? `${id}-${size}-message` : undefined}
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
              required
              requiredMessage="Select a delivery method."
              size={size}
              status={missing[size] ? 'danger' : 'neutral'}
              aria-labelledby={`${id}-${size}-label`}
              aria-describedby={`${id}-${size}-description${missing[size] ? ` ${id}-${size}-message` : ''}`}
              aria-invalid={missing[size] || undefined}
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
        labelId={`${id}-radio-label`}
        description={<bdi>Applies to newly shared documents.</bdi>}
        descriptionId={`${id}-radio-description`}
      >
        <RadioGroup
          name={`${id}-access`}
          defaultValue="read"
          aria-labelledby={`${id}-radio-label`}
          aria-describedby={`${id}-radio-description`}
        >
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
        labelId={`${id}-switch-label`}
        description={<bdi>Each setting takes effect independently.</bdi>}
        descriptionId={`${id}-switch-description`}
      >
        <SwitchGroup
          aria-labelledby={`${id}-switch-label`}
          aria-describedby={`${id}-switch-description`}
        >
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
        labelId={`${id}-cards-label`}
        description={<bdi>Select the sources people can discover.</bdi>}
        descriptionId={`${id}-cards-description`}
      >
        <CheckboxCardGroup
          aria-labelledby={`${id}-cards-label`}
          aria-describedby={`${id}-cards-description`}
        >
          <CheckboxCard
            label="Published documents"
            description={<bdi>Reviewed and ready to share.</bdi>}
            defaultChecked
          />
          <CheckboxCard label="Working drafts" description={<bdi>Still open for feedback.</bdi>} />
        </CheckboxCardGroup>
      </FormField>
    </Stack>
  );
}
