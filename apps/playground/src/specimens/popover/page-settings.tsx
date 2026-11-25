import { useId, useState } from 'react';
import { flushSync } from 'react-dom';
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
  const [revision, setRevision] = useState(0);
  const inputId = formId + '-name';
  return (
    <form
      {...formProps}
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const value = new FormData(form).get('name');
        if (typeof value !== 'string' || value === name) {
          return;
        }
        const input = form.querySelector('input');
        const leadingSpaces = value.length - value.trimStart().length;
        const selection =
          input && input === form.ownerDocument.activeElement
            ? {
                start: Math.max(0, (input.selectionStart ?? 0) - leadingSpaces),
                end: Math.max(0, (input.selectionEnd ?? 0) - leadingSpaces),
                direction: input.selectionDirection ?? 'none',
              }
            : null;
        // The next native reset must already see the newly accepted default.
        flushSync(() => {
          onSave(value.trim());
          setRevision((current) => current + 1);
        });
        if (selection) {
          const savedInput = form.querySelector('input');
          savedInput?.focus({ preventScroll: true });
          savedInput?.setSelectionRange(selection.start, selection.end, selection.direction);
        }
      }}
    >
      <Stack gap={8}>
        <Text as="label" htmlFor={inputId} size="body-s" color="secondary">
          Display name
        </Text>
        <Input
          key={revision}
          id={inputId}
          dir="auto"
          name="name"
          defaultValue={name}
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
