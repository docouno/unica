import { defineGlyph } from '@docouno/unica';
import {
  ArrowLeftIcon,
  BellIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  InfoIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  WarningCircleIcon,
  WarningIcon,
  XCircleIcon,
  BooksIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  GitBranchIcon,
  SidebarSimpleIcon,
  SlidersHorizontalIcon,
  TrashIcon,
  UserCircleIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react/ssr';

// Context-free Phosphor sources preserve the prototype control chrome.
export const BackGlyph = defineGlyph(ArrowLeftIcon, 'phosphor');
export const CloseGlyph = defineGlyph(XIcon, 'phosphor');
export const CaretDownGlyph = defineGlyph(CaretDownIcon, 'phosphor');
export const CaretLeftGlyph = defineGlyph(CaretLeftIcon, 'phosphor');
export const CaretRightGlyph = defineGlyph(CaretRightIcon, 'phosphor');
export const CaretUpGlyph = defineGlyph(CaretUpIcon, 'phosphor');
export const CheckGlyph = defineGlyph(CheckIcon, 'phosphor');
export const BusyGlyph = defineGlyph(CircleNotchIcon, 'phosphor');
export const LockGlyph = defineGlyph(LockSimpleIcon, 'phosphor');
export const SearchGlyph = defineGlyph(MagnifyingGlassIcon, 'phosphor');
export const MinusGlyph = defineGlyph(MinusIcon, 'phosphor');
export const PlusGlyph = defineGlyph(PlusIcon, 'phosphor');
export const NotificationGlyph = defineGlyph(BellIcon, 'phosphor');
export const ErrorGlyph = defineGlyph(XCircleIcon, 'phosphor');

export const BooksGlyph = defineGlyph(BooksIcon, 'phosphor');

export const FileGlyph = defineGlyph(FileIcon, 'phosphor');

export const FileTextGlyph = defineGlyph(FileTextIcon, 'phosphor');

export const FolderGlyph = defineGlyph(FolderIcon, 'phosphor');

export const BranchGlyph = defineGlyph(GitBranchIcon, 'phosphor');

export const SidebarGlyph = defineGlyph(SidebarSimpleIcon, 'phosphor');

export const SlidersGlyph = defineGlyph(SlidersHorizontalIcon, 'phosphor');

export const TrashGlyph = defineGlyph(TrashIcon, 'phosphor');

export const AccountGlyph = defineGlyph(UserCircleIcon, 'phosphor');

export const UserGlyph = defineGlyph(UserIcon, 'phosphor');

export const fieldStatusGlyphs = {
  info: defineGlyph(InfoIcon, 'phosphor'),
  success: defineGlyph(CheckCircleIcon, 'phosphor'),
  warning: defineGlyph(WarningIcon, 'phosphor'),
  danger: defineGlyph(WarningCircleIcon, 'phosphor'),
} as const;
