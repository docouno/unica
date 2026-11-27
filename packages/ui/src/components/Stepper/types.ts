import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';
import type { ORIENTATION, SIZE, STATUS } from '../../consts.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';

export type StepperSize = (typeof SIZE)['s' | 'm' | 'l'];
export type StepperLayout =
  'responsive' | 'compact' | (typeof ORIENTATION)[keyof typeof ORIENTATION];
export type StepperStepStatus = (typeof STATUS)['neutral' | 'danger'];

export interface StepperMessages {
  readonly allSteps: string;
  readonly allComplete: string;
  readonly markerNumber: (index: number) => string;
  readonly position: (index: number, total: number) => string;
  readonly completedCount: (count: number, total: number) => string;
  readonly stepLabel: (index: number, label: string, completed: boolean) => string;
  readonly needsAttention: (message?: string) => string;
  readonly checkStep: (label: string) => string;
}

interface StepperHost<Element extends HTMLElement> {
  readonly id?: string | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly dir?: HTMLAttributes<Element>['dir'] | undefined;
  readonly lang?: string | undefined;
  readonly ref?: Ref<Element> | undefined;
  readonly [name: `data-${string}`]: DataAttributeValue;
  readonly [name: `data-unica-stepper-${string}`]: never;
}

type StepperName =
  | { readonly 'aria-label': string; readonly 'aria-labelledby'?: string | undefined }
  | { readonly 'aria-label'?: string | undefined; readonly 'aria-labelledby': string };

export type StepperProps = StepperHost<HTMLDivElement> &
  StepperName & {
    readonly 'aria-describedby'?: string | undefined;
    readonly children?: ReactNode | undefined;
    readonly value?: string | null | undefined;
    readonly defaultValue?: string | null | undefined;
    readonly onValueChange?: ((value: string) => void) | undefined;
    readonly allowReturn?: boolean | undefined;
    readonly size?: StepperSize | undefined;
    readonly layout?: StepperLayout | undefined;
    readonly messages?: Partial<StepperMessages> | undefined;
  };

export interface StepperStepProps extends StepperHost<HTMLLIElement> {
  readonly value: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly completed?: boolean | undefined;
  readonly status?: StepperStepStatus | undefined;
  readonly message?: string | undefined;
}
