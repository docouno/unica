import { useId, useRef, useState } from 'react';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';
import {
  Button,
  CheckboxCard,
  FormField,
  Input,
  Select,
  Stack,
  Text,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@docouno/unica';
import type { DrawerContentProps } from '@docouno/unica';
import '@docouno/unica/styles.css';

const actions = [
  { value: 'all', label: 'All actions' },
  { value: 'publication', label: 'Publication' },
  { value: 'access', label: 'Access changes' },
  { value: 'review', label: 'Reviews' },
];

export function ActivityFilters({
  contentProps = {},
  subject = {},
  formProps = {},
}: {
  readonly contentProps?: Pick<DrawerContentProps, 'size' | 'width' | 'side'>;
  readonly subject?: object;
  readonly formProps?: object;
} = {}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);
  const [filters, setFilters] = useState({ action: 'all', actor: '', scheduled: true });
  const [action, setAction] = useState(filters.action);
  const [applied, setApplied] = useState(false);
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setAction(filters.action);
        }
        setOpen(next);
      }}
    >
      <Stack className="dialog-study-launch" data-open={open || undefined} align="center" gap={8}>
        <DrawerTrigger {...(!open ? subject : {})} ref={triggerRef} asChild>
          <Button variant="secondary" tone="neutral" iconLeft={SlidersHorizontalIcon}>
            Filter activity
          </Button>
        </DrawerTrigger>
        {applied && (
          <Text
            role="status"
            size="body-s"
            dir="auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              padding: 'var(--space-4) var(--space-8)',
              textAlign: 'center',
              overflowWrap: 'anywhere',
            }}
          >
            Filters applied · {actions.find((item) => item.value === filters.action)?.label} ·{' '}
            {filters.actor || 'All actors'} ·{' '}
            {filters.scheduled ? 'Scheduled events included' : 'Scheduled events excluded'}
          </Text>
        )}
      </Stack>
      <DrawerContent {...subject} width="s" side="end" {...contentProps} returnFocus={triggerRef}>
        <DrawerHeader>
          <div>
            <DrawerTitle>Filter activity</DrawerTitle>
            <DrawerDescription>
              Choose which actions, people and scheduled events to include.
            </DrawerDescription>
          </div>
          <DrawerClose aria-label="Close activity filters" />
        </DrawerHeader>
        <DrawerBody>
          <form
            {...formProps}
            id={id}
            className="dialog-study-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const actor = data.get('actor');
              setFilters({
                action,
                actor: typeof actor === 'string' ? actor : '',
                scheduled: data.has('scheduled'),
              });
              setApplied(true);
              setOpen(false);
            }}
          >
            <FormField controlId={id + '-action'} label="Action type">
              <Select
                id={id + '-action'}
                name="action"
                options={actions}
                value={action}
                onValueChange={(next) => {
                  if (next) {
                    setAction(next);
                  }
                }}
              />
            </FormField>
            <FormField controlId={id + '-actor'} label="Actor">
              <Input
                id={id + '-actor'}
                name="actor"
                defaultValue={filters.actor}
                placeholder="All people and services"
              />
            </FormField>
            <CheckboxCard
              name="scheduled"
              label="Include scheduled events"
              description={<bdi>Show changes made by automation.</bdi>}
              defaultChecked={filters.scheduled}
            />
          </form>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary" tone="neutral">
              Cancel
            </Button>
          </DrawerClose>
          <Button form={id} type="submit">
            Apply filters
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
