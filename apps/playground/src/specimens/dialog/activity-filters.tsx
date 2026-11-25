import { useId, useState } from 'react';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';
import { Button, Input, Stack, Text } from '@docouno/unica';
import { CheckboxCard } from '../../prototypes/choice-card/choice-card.proto.js';
import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import { Select } from '../../prototypes/select/select.proto.js';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../../prototypes/dialog/dialog.proto.js';
import '@docouno/unica/styles.css';

const actions = [
  { value: 'all', label: 'All actions' },
  { value: 'publication', label: 'Publication' },
  { value: 'access', label: 'Access changes' },
  { value: 'review', label: 'Reviews' },
];

export function ActivityFilters({ contentProps = {}, subject = {} } = {}) {
  const id = useId();
  const [open, setOpen] = useState(true);
  const [filters, setFilters] = useState({ action: 'all', actor: '', scheduled: true });
  const [action, setAction] = useState(filters.action);
  const [applied, setApplied] = useState(false);
  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        display: 'grid',
        placeItems: 'center',
        inlineSize: '100%',
        blockSize: 540,
      }}
    >
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (next) {
            setAction(filters.action);
          }
          setOpen(next);
        }}
      >
        <Stack
          align="center"
          gap={8}
          inert={open}
          style={{ visibility: open ? 'hidden' : 'visible' }}
        >
          <DrawerTrigger
            {...(!open ? subject : {})}
            variant="secondary"
            tone="neutral"
            iconLeft={SlidersHorizontalIcon}
          >
            Filter activity
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
        <DrawerContent {...subject} width="s" side="end" {...contentProps} described>
          <DrawerHeader closeLabel="Close activity filters">
            <DrawerTitle>Filter activity</DrawerTitle>
            <DrawerDescription>
              Choose which actions, people and scheduled events to include.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <form
              id={id}
              style={{ display: 'grid', gap: 'var(--dialog-gap)' }}
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
              <input type="hidden" name="action" value={action} />
              <Select
                label="Action type"
                options={actions}
                value={action}
                onValueChange={(next) => {
                  if (next) {
                    setAction(next);
                  }
                }}
              />
              <FormField htmlFor={id + '-actor'} label="Actor">
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
            <DrawerClose>Cancel</DrawerClose>
            <Button form={id} type="submit">
              Apply filters
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
