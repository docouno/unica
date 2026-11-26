import { useContext, useId } from 'react';
import type { MouseEvent, ReactElement } from 'react';
import { guardActivation } from '../../core/guardActivation.js';
import { cx, dataFlag } from '../../core/cx.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { useLevel, useMenu } from './menu-context.js';
import { MenuRadioContext } from './MenuGroup.js';
import { MenuRowFrame, rowAttributes, RowContent } from './row.js';
import type {
  MenuButtonItemProps,
  MenuCheckboxItemProps,
  MenuItemProps,
  MenuLinkItemProps,
  MenuRadioItemProps,
} from './types.js';
import './menu.css';

function CommandButton({
  children,
  description,
  icon,
  disabled,
  shortcut,
  tone = 'neutral',
  className,
  id,
  onClick,
  ...props
}: MenuButtonItemProps): ReactElement {
  const { controller } = useMenu();
  const panel = useLevel();
  const uid = useId();
  return (
    <MenuRowFrame inactive={Boolean(controller.inlineChild(panel))}>
      <button
        {...props}
        {...guardActivation(props, () => Boolean(disabled))}
        {...rowAttributes(
          id ?? uid,
          `${uid}-label`,
          description,
          props['aria-describedby'],
          disabled,
        )}
        type="button"
        role="menuitem"
        className={cx('unica-menu-row', className)}
        data-unica-menu-tone={tone}
        data-unica-menu-has-shortcut={dataFlag(Boolean(shortcut))}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
          if (!event.defaultPrevented) {
            controller.requestClose();
          }
        }}
      >
        <RowContent
          label={children}
          labelId={`${uid}-label`}
          description={description}
          icon={icon}
          shortcut={shortcut}
        />
      </button>
    </MenuRowFrame>
  );
}

function CommandLink({
  children,
  description,
  icon,
  href,
  disabled,
  shortcut,
  tone = 'neutral',
  className,
  id,
  onClick,
  ...props
}: MenuLinkItemProps): ReactElement {
  const { controller } = useMenu();
  const panel = useLevel();
  const uid = useId();

  function activate(event: MouseEvent<HTMLAnchorElement>): void {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    ) {
      controller.requestClose();
    }
  }

  return (
    <MenuRowFrame inactive={Boolean(controller.inlineChild(panel))}>
      <a
        {...props}
        {...guardActivation(props, () => Boolean(disabled))}
        {...rowAttributes(
          id ?? uid,
          `${uid}-label`,
          description,
          props['aria-describedby'],
          disabled,
        )}
        href={disabled ? undefined : href}
        role="menuitem"
        className={cx('unica-menu-row', className)}
        data-unica-menu-tone={tone}
        data-unica-menu-has-shortcut={dataFlag(Boolean(shortcut))}
        onClick={activate}
      >
        <RowContent
          label={children}
          labelId={`${uid}-label`}
          description={description}
          icon={icon}
          shortcut={shortcut}
        />
      </a>
    </MenuRowFrame>
  );
}

/** Performs a command or navigates with a real link when href is supplied. */
export function MenuItem(props: MenuItemProps): ReactElement {
  return props.href !== undefined ? <CommandLink {...props} /> : <CommandButton {...props} />;
}

type ChoiceRowProps = Omit<
  MenuCheckboxItemProps,
  'checked' | 'defaultChecked' | 'onCheckedChange'
> & {
  readonly checked: boolean;
  readonly radio?: boolean | undefined;
  readonly select: () => void;
};

function ChoiceRow({
  children,
  description,
  icon,
  disabled,
  checked,
  radio,
  className,
  id,
  onClick,
  select,
  ...props
}: ChoiceRowProps): ReactElement {
  const { controller } = useMenu();
  const panel = useLevel();
  const uid = useId();
  return (
    <MenuRowFrame inactive={Boolean(controller.inlineChild(panel))}>
      <button
        {...props}
        {...guardActivation(props, () => Boolean(disabled))}
        {...rowAttributes(
          id ?? uid,
          `${uid}-label`,
          description,
          props['aria-describedby'],
          disabled,
        )}
        role={radio ? 'menuitemradio' : 'menuitemcheckbox'}
        type="button"
        aria-checked={checked}
        className={cx('unica-menu-row', className)}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
          if (!event.defaultPrevented) {
            select();
          }
        }}
      >
        <RowContent
          label={children}
          labelId={`${uid}-label`}
          description={description}
          icon={icon}
          checked={checked}
          radio={radio}
        />
      </button>
    </MenuRowFrame>
  );
}

/** Toggles one setting while keeping the menu open. */
export function MenuCheckboxItem({
  checked,
  defaultChecked = false,
  onCheckedChange,
  ...props
}: MenuCheckboxItemProps): ReactElement {
  const [current, { read, propose }] = useStateAuthority({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  return <ChoiceRow {...props} checked={current} select={() => propose(!read())} />;
}

/** Chooses a value from the surrounding radio group and requests menu dismissal. */
export function MenuRadioItem({ value, ...props }: MenuRadioItemProps): ReactElement {
  const group = useContext(MenuRadioContext);
  const { controller } = useMenu();
  if (!group) {
    throw new Error('MenuRadioItem requires MenuRadioGroup.');
  }
  return (
    <ChoiceRow
      {...props}
      radio
      checked={group.value === value}
      select={() => {
        if (group.read() !== value) {
          group.propose(value);
        }
        controller.requestClose();
      }}
    />
  );
}
