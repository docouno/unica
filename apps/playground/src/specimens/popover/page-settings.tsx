import { useId, useState } from 'react';
import {
  Button,
  Input,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Stack,
  Text,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

function NameForm({ formId = '', name = '', formProps = {}, onSave = console.log }) {
  const [draft, setDraft] = useState(name);
  return (
    <form
      {...formProps}
      id={formId}
      onReset={(event) => {
        const reset = event.nativeEvent;
        const form = event.currentTarget;
        setTimeout(() => {
          if (!reset.defaultPrevented && form.isConnected) {
            setDraft(name);
          }
        }, 0);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('name');
        if (typeof value === 'string') {
          const saved = value.trim();
          setDraft(saved);
          onSave(saved);
        }
      }}
    >
      <Stack gap={8}>
        <Text as="label" htmlFor={formId + '-name'} size="body-s" color="secondary">
          Display name
        </Text>
        <Input
          id={formId + '-name'}
          dir="auto"
          name="name"
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          required
          pattern={'.*\\S.*'}
        />
      </Stack>
    </form>
  );
}

export function PageSettings({
  rootProps = {},
  contentProps = {},
  asChild = true,
  disabled = false,
  showTitle = true,
  showDescription = true,
  subject = {},
  formProps = {},
  mountKey = 'initial',
} = {}) {
  const formId = useId();
  const [name, setName] = useState('Release notes');
  return (
    <Stack gap={12} align="start">
      <Popover key={mountKey} onOpenChange={(open) => console.log(open)} {...rootProps}>
        {asChild ? (
          <PopoverTrigger {...subject} asChild disabled={disabled}>
            <Button variant="secondary">Page settings</Button>
          </PopoverTrigger>
        ) : (
          <PopoverTrigger {...subject} disabled={disabled}>
            Page settings
          </PopoverTrigger>
        )}
        <PopoverContent {...subject} {...contentProps}>
          <PopoverHeader>
            {showTitle && <PopoverTitle>Page settings</PopoverTitle>}
            <PopoverClose />
            {showDescription && (
              <PopoverDescription>
                <bdi>Change the display name for this page.</bdi>
              </PopoverDescription>
            )}
          </PopoverHeader>
          <PopoverBody>
            <NameForm formId={formId} name={name} formProps={formProps} onSave={setName} />
          </PopoverBody>
          <PopoverFooter>
            <Button size="s" variant="secondary" type="reset" form={formId}>
              Reset name
            </Button>
            <Button size="s" type="submit" form={formId}>
              Save name
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
      <Text size="body-s" color="secondary" dir="auto">
        Page name: <bdi>{name}</bdi>
      </Text>
    </Stack>
  );
}
