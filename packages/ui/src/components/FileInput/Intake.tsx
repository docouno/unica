import { useCallback, useId, useMemo, useRef } from 'react';
import type { DragEvent, DragEventHandler, KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx, dataFlag } from '../../core/cx.js';
import { FormInput } from '../../core/forms/carriers.js';
import {
  fieldControlId,
  fieldDescription,
  idRefs,
  useFormField,
} from '../../core/forms/field-context.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { Button, IconButton } from '../Button/index.js';
import { Icon } from '../Icon/index.js';
import { VisuallyHidden } from '../Layout/index.js';
import { Spinner } from '../Progress/index.js';
import { rejectionGlyph, removeGlyph } from './glyphs.js';
import { formatFileSize, intakeCopy, resolveMessages } from './messages.js';
import type { DropzoneProps, FileInputProps } from './types.js';
import { suppressRepeatedActivation, useFileIntake } from './use-file-intake.js';
import { useNativeLabelIds } from './use-native-label.js';

type IntakeProps = FileInputProps &
  Pick<DropzoneProps, 'description'> & {
    readonly layout: 'file-input' | 'dropzone';
  };

export function Intake({
  layout,
  value,
  onValueChange,
  onIntake,
  ref,
  multiple: multipleProp,
  accept,
  maxSize,
  maxFiles,
  allowPaste = false,
  announceIntake = true,
  messages: customMessages,
  variant = 'default',
  status: statusProp,
  clearable = true,
  showSize = false,
  size: sizeProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  required: requiredProp,
  loading: loadingProp = false,
  description,
  id,
  name,
  form,
  capture,
  className,
  style,
  title,
  dir,
  lang,
  hidden,
  inert,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  tabIndex,
  autoFocus,
  onClick,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  onPaste,
  onInvalid,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  ...root
}: IntakeProps): ReactElement {
  const well = layout === 'dropzone';
  const multiple = multipleProp ?? well;
  const field = useFormField();
  const fieldId = fieldControlId(field?.target === 'control' ? field : null, id);
  const size = sizeProp ?? field?.size ?? 'm';
  const disabled = disabledProp ?? field?.disabled ?? false;
  const readOnly = readOnlyProp ?? field?.readOnly ?? false;
  const required = requiredProp ?? field?.required ?? false;
  const status =
    statusProp ?? (well && field?.status !== 'danger' ? 'neutral' : field?.status) ?? 'neutral';
  const messages = useMemo(() => resolveMessages(intakeCopy, customMessages), [customMessages]);
  const ids = useId();
  const compactTarget = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const chooser = useRef<HTMLInputElement>(null);
  const companionHost = useRef<HTMLSpanElement>(null);
  const mergedRef = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(input, ref)(node),
    [ref],
  );
  const getTarget = (): HTMLElement | null => compactTarget.current;
  const getLabelable = useCallback(
    () => (well ? input.current : (compactTarget.current as HTMLButtonElement | null)),
    [well],
  );
  const shouldAutofocus = useRef(autoFocus);
  const intake = useFileIntake(
    {
      value,
      onValueChange,
      onIntake,
      multiple,
      accept,
      maxSize,
      maxFiles,
      allowPaste,
      disabled,
      readOnly,
      loading: loadingProp,
      messages,
      form,
      focusAttribute: 'data-unica-dropzone-focus-origin',
    },
    { input, chooser, companionHost },
  );

  useIsoLayoutEffect(() => {
    if (intake.ready && shouldAutofocus.current) {
      shouldAutofocus.current = false;
      (well ? input.current : compactTarget.current)?.focus();
    }
  }, [intake.ready, well]);

  const isDisabled = intake.disabled;
  const isReadOnly = !isDisabled && readOnly;
  const loading = !isDisabled && !isReadOnly && loadingProp;
  const isRequired = !isDisabled && !isReadOnly && required;
  const invalid = !isDisabled && (status === 'danger' || intake.projectionError);
  const action = multiple ? messages.addFiles : messages.chooseFile;
  const actionId = `${ids}-action`;
  const selectionId = `${ids}-selection`;
  const limitsId = `${ids}-limits`;
  const checkingId = `${ids}-checking`;
  const readOnlyId = `${ids}-readonly`;
  const requiredId = `${ids}-required`;
  const feedbackId = `${ids}-feedback`;
  const syncId = `${ids}-sync`;
  const hasSelection = intake.files.length > 0;
  const file = intake.files[0];
  const hasDescription =
    description !== undefined &&
    description !== null &&
    description !== false &&
    description !== '';
  const { rules } = intake;
  const showCount =
    well || multiple || (maxFiles !== undefined && Number.isInteger(maxFiles) && maxFiles >= 0);
  const limits = messages.limits(
    rules.accept,
    rules.maxSize,
    showCount ? rules.maxFiles : undefined,
  );
  const feedback = isDisabled ? null : intake.feedback;
  const fieldName = labelledBy ?? (label === undefined ? field?.labelId : undefined);
  const nativeLabelIds = useNativeLabelIds(
    getLabelable,
    fieldName || label !== undefined || (!well && isReadOnly) ? undefined : fieldId,
    ids,
  );
  const associatedName = fieldName ?? nativeLabelIds;
  const actionName = associatedName ? idRefs(actionId, associatedName) : undefined;
  const compactName =
    !associatedName && label ? (isReadOnly ? label : `${action} · ${label}`) : undefined;
  const wellName =
    label && !label.toLowerCase().includes(messages.browse.toLowerCase())
      ? `${messages.browse} · ${label}`
      : (label ?? messages.browse);
  const accessible = {
    id: fieldId,
    tabIndex,
    onFocus,
    onBlur,
    onKeyUp,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);
      suppressRepeatedActivation(event);
      if (well && intake.blocked && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
      }
    },
    onPaste: composeEventHandlers(onPaste, intake.paste),
    'aria-describedby': idRefs(
      fieldDescription(field, describedBy, isDisabled),
      selectionId,
      limits || hasDescription ? limitsId : undefined,
      isRequired && !well ? requiredId : undefined,
      loading ? checkingId : undefined,
      isReadOnly ? readOnlyId : undefined,
      feedback?.text ? feedbackId : undefined,
      !isDisabled && intake.projectionError ? syncId : undefined,
    ),
    'aria-invalid': invalid || undefined,
  };
  const carrier = {
    controlled: intake.controlled,
    ref: mergedRef,
    type: 'file',
    name,
    form,
    capture,
    accept: rules.accept || undefined,
    multiple,
    disabled: !intake.ready || disabled,
    required: isRequired,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      intake.changeCarrier(event.currentTarget),
    onInvalid,
  };
  function localDrag(
    author: DragEventHandler<HTMLDivElement> | undefined,
    handle: DragEventHandler<HTMLDivElement>,
  ): DragEventHandler<HTMLDivElement> {
    return (event: DragEvent<HTMLDivElement>) => {
      author?.(event);
      handle(event);
    };
  }
  const dropHandlers = {
    onDragEnter: localDrag(onDragEnter, intake.dragEnter),
    onDragOver: localDrag(onDragOver, intake.dragOver),
    onDragLeave: localDrag(onDragLeave, intake.dragLeave),
    onDrop: localDrag(onDrop, intake.drop),
  };
  const choose = (event: MouseEvent<HTMLElement>): void => {
    onClick?.(event);
    const canceled = event.defaultPrevented;
    if (well) {
      event.preventDefault();
    }
    if (!canceled) {
      intake.open();
    }
  };

  return (
    <div
      {...pickConsumerDataAttributes(root)}
      style={style}
      title={title}
      dir={dir}
      lang={lang}
      hidden={hidden}
      inert={inert}
      {...(!well && dropHandlers)}
      className={cx(well ? 'unica-dropzone' : 'unica-file-input', className)}
      data-unica-file-intake-size={size}
      data-unica-file-intake-disabled={dataFlag(isDisabled)}
      data-unica-file-intake-readonly={dataFlag(isReadOnly)}
      data-unica-file-intake-loading={dataFlag(loading)}
      data-unica-file-intake-dragging={dataFlag(intake.dragging)}
      data-unica-file-intake-status={isDisabled ? 'neutral' : status}
    >
      {well ? (
        <div className="unica-dropzone-surface" {...dropHandlers}>
          <div className="unica-dropzone-copy">
            {isDisabled || isReadOnly ? (
              <span className="unica-dropzone-unavailable" id={isReadOnly ? readOnlyId : undefined}>
                {isDisabled ? messages.disabled : messages.readOnly}
              </span>
            ) : loading ? (
              <span className="unica-dropzone-checking" id={checkingId}>
                <Spinner />
                {messages.checking}
              </span>
            ) : (
              <div className="unica-dropzone-prompt">
                <span className="unica-dropzone-invitation">
                  {messages.invitation(
                    multiple,
                    <span className="unica-dropzone-browse">{messages.browse}</span>,
                  )}
                </span>
                {intake.dragging && (
                  <span className="unica-dropzone-release">{messages.releaseToAdd}</span>
                )}
              </div>
            )}
            {(limits || hasDescription) && (
              <div className="unica-dropzone-description" id={limitsId}>
                {hasDescription && <div>{description}</div>}
                {limits && <div>{limits}</div>}
              </div>
            )}
          </div>
          <FormInput
            {...carrier}
            {...accessible}
            className="unica-dropzone-input"
            aria-labelledby={actionName}
            aria-label={actionName ? undefined : wellName}
            aria-busy={loading || undefined}
            aria-disabled={isReadOnly || loading || undefined}
            onClick={choose}
          />
          {actionName && <VisuallyHidden id={actionId}>{messages.browse}</VisuallyHidden>}
          <VisuallyHidden id={selectionId}>
            {!multiple && file && !customMessages?.selection ? (
              <bdi>{file.name}</bdi>
            ) : (
              messages.selection(intake.files, showSize)
            )}
          </VisuallyHidden>
        </div>
      ) : (
        <>
          <div className="unica-file-input-line">
            {isReadOnly ? (
              <span
                {...accessible}
                ref={compactTarget}
                className="unica-file-input-inspector"
                tabIndex={tabIndex ?? 0}
                role="group"
                aria-labelledby={fieldName}
                aria-label={fieldName ? undefined : (compactName ?? 'File attachment')}
                onClick={onClick}
              >
                <span className="unica-file-input-selection" id={selectionId}>
                  <bdi>
                    {file && !customMessages?.selection && !multiple
                      ? file.name
                      : messages.selection(intake.files, showSize)}
                  </bdi>
                  {file && showSize && !multiple && !customMessages?.selection && (
                    <span className="unica-file-input-detail">{formatFileSize(file.size)}</span>
                  )}
                </span>
                <span className="unica-file-input-note" id={readOnlyId}>
                  {messages.readOnly}
                </span>
              </span>
            ) : (
              <>
                <Button
                  {...accessible}
                  ref={(node) => {
                    compactTarget.current = node;
                  }}
                  type="button"
                  size={size}
                  variant={variant === 'ghost' ? 'ghost' : 'secondary'}
                  tone="neutral"
                  disabled={!intake.ready || disabled}
                  loading={loading}
                  aria-labelledby={actionName}
                  aria-label={compactName}
                  onClick={choose}
                >
                  <span className="unica-file-input-prompt">
                    <span id={actionId} className="unica-file-input-action">
                      {action}
                    </span>
                    {intake.dragging && (
                      <span aria-hidden="true">
                        {multiple ? messages.dropFiles : messages.dropFile}
                      </span>
                    )}
                  </span>
                </Button>
                {hasSelection && (
                  <span className="unica-file-input-selection">
                    <span id={selectionId} className="unica-file-input-copy">
                      <bdi>
                        {multiple || customMessages?.selection
                          ? messages.selection(intake.files, showSize)
                          : file?.name}
                      </bdi>
                      {file && showSize && !multiple && !customMessages?.selection && (
                        <span className="unica-file-input-detail">{formatFileSize(file.size)}</span>
                      )}
                    </span>
                    {!multiple && file && clearable && !isDisabled && (
                      <IconButton
                        icon={removeGlyph}
                        size="s"
                        variant="ghost"
                        tone="neutral"
                        type="button"
                        disabled={loading || !intake.ready}
                        aria-label={messages.remove(file.name)}
                        onKeyDown={suppressRepeatedActivation}
                        onClick={() => {
                          if (intake.clear()) {
                            compactTarget.current?.focus();
                          }
                        }}
                      />
                    )}
                  </span>
                )}
                {!hasSelection && (
                  <VisuallyHidden id={selectionId}>
                    {messages.selection(intake.files, showSize)}
                  </VisuallyHidden>
                )}
              </>
            )}
            {loading && (
              <span className="unica-file-input-note" id={checkingId}>
                {messages.checking}
              </span>
            )}
          </div>
          {limits && (
            <div className="unica-file-intake-limits" id={limitsId}>
              {limits}
            </div>
          )}
          {isRequired && <VisuallyHidden id={requiredId}>{messages.required}</VisuallyHidden>}
          <FormInput
            {...carrier}
            getFocusTarget={getTarget}
            onClick={(event) => {
              // The named input is for submission. Its public focus lands on the trigger.
              event.preventDefault();
            }}
          />
        </>
      )}
      <span ref={companionHost} hidden />
      {intake.ready && (
        <input
          key={intake.chooserKey}
          ref={chooser}
          type="file"
          hidden
          tabIndex={-1}
          aria-hidden="true"
          accept={carrier.accept}
          multiple={multiple}
          capture={capture}
          disabled={intake.blocked}
          onChange={(event) => intake.changeChooser(event.currentTarget)}
        />
      )}
      {feedback?.text && (
        <div
          className="unica-file-intake-feedback"
          id={feedbackId}
          data-unica-file-intake-rejection={dataFlag(feedback.rejected)}
        >
          {feedback.rejected && <Icon usage="slot" icon={rejectionGlyph} />}
          <span dir="auto">{feedback.text}</span>
        </div>
      )}
      {!isDisabled && intake.projectionError && (
        <div
          className="unica-file-intake-feedback"
          id={syncId}
          role="status"
          data-unica-file-intake-rejection=""
        >
          Files could not be saved to this field. Clear the selection or try again.
        </div>
      )}
      {announceIntake && (
        <VisuallyHidden role="status" aria-atomic="true">
          {feedback && <span key={feedback.id}>{feedback.text}</span>}
        </VisuallyHidden>
      )}
    </div>
  );
}
