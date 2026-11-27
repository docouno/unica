import { useId, useLayoutEffect, useRef, useState } from 'react';
import { folioSceneHref } from './folio/folio.routes.js';
import type { ReactElement } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { defineScene } from '../workbench/types.js';
import { AppShell, Header } from '../prototypes/app-shell/app-shell.proto.js';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
  Alert,
  AlertClose,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  Dropzone,
  FileInput,
  FileList,
  FileListItem,
  FormField,
  Progress,
  Text,
  Title,
  Button,
  RadioCard,
  RadioCardGroup,
  Stepper,
  StepperStep,
  ToastProvider,
  useToast,
} from '@docouno/unica';
import type { FileIntakeResult, FileListItemState, ToastId } from '@docouno/unica';
import { FolioToastRegion } from './folio/folio.toast.js';
import { FolioRail, FolioScene, PageIntro } from './folio/folio.shared.js';
import './folio/folio.settings.css';

interface StagedArchive {
  readonly id: string;
  readonly name: string;
  readonly bytes: number;
  readonly file?: File;
  readonly state: FileListItemState;
}

type ImportSource = 'schema' | 'archives';

interface ImportError {
  readonly attempt: number;
  readonly message: string;
  readonly source: ImportSource;
}

const maxArchiveBytes = 50 * 1024 * 1024;
const archiveLimit = `${(maxArchiveBytes / 1_000_000).toFixed(1)} MB`;
const savedSchema = { name: 'folio-adr-schema-v3.yaml', fileSize: 18_400 };

const initialUpload: StagedArchive = {
  id: 'rfcs',
  name: 'legacy-envoy-rfcs.zip',
  bytes: 6_400_000,
  state: { phase: 'uploading', label: 'Uploading archive…', progress: 65 },
};

const initialArchives: readonly StagedArchive[] = [
  {
    id: 'runbooks',
    name: 'core-infra-runbooks-2026-q3.zip',
    bytes: 18_200_000,
    state: { phase: 'success', label: '28 docs verified' },
  },
  initialUpload,
];

function WorkspaceAdminScene(): ReactElement {
  const [hasSavedSchema, setHasSavedSchema] = useState(true);
  const [schema, setSchema] = useState<readonly File[]>([]);
  const hasSchema = hasSavedSchema || schema.length > 0;
  const policyLabelId = useId();
  const [policy, setPolicy] = useState('revision');
  const [archives, setArchives] = useState<readonly StagedArchive[]>(initialArchives);
  const stagedArchives = useRef(initialArchives);
  const [currentStep, setCurrentStep] = useState<'source' | 'verify' | 'commit'>('verify');
  const [validation, setValidation] = useState<'checking' | 'required' | 'verified'>('checking');
  const [error, setError] = useState<ImportError | null>(null);
  const toast = useToast();
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const activityToast = useRef<ToastId | null>(null);
  const validationToast = useRef<ToastId | null>(null);
  const importToast = useRef<ToastId | null>(null);
  const seeded = useRef(false);
  const footer = useRef<HTMLDivElement>(null);
  const attempt = useRef(0);
  const summary = useRef<HTMLDivElement>(null);
  const summaryClose = useRef<HTMLButtonElement>(null);
  const schemaPicker = useRef<HTMLInputElement>(null);
  const archivesPicker = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<{
    readonly source: ImportSource;
    readonly document: Document;
  } | null>(null);
  useLayoutEffect(() => {
    const restoration = restoreFocus.current;
    restoreFocus.current = null;
    if (!restoration || restoration.document.activeElement !== restoration.document.body) {
      return;
    }
    if (error) {
      summaryClose.current?.focus();
    } else if (restoration.source === 'schema') {
      schemaPicker.current?.focus();
    } else {
      archivesPicker.current?.focus();
    }
  }, [error]);

  const sourceHeading = useRef<HTMLHeadingElement>(null);
  const verificationHeading = useRef<HTMLHeadingElement>(null);
  const commitStatus = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    if (currentStep === 'commit') {
      commitStatus.current?.focus();
    }
  }, [currentStep]);

  useLayoutEffect(() => {
    const scene = footer.current?.closest<HTMLElement>('.folio-scene');
    if (!scene) {
      return;
    }
    const update = (): void => {
      const height = viewport?.getBoundingClientRect().height ?? 0;
      scene.style.setProperty(
        '--folio-toast-clearance',
        `${height > 0 ? Math.ceil(height) + 48 : 64}px`,
      );
    };
    update();
    if (viewport) {
      const view = viewport.ownerDocument.defaultView;
      if (view) {
        const observer = new view.ResizeObserver(update);
        observer.observe(viewport);
        return () => observer.disconnect();
      }
    }
  }, [viewport]);

  useLayoutEffect(() => {
    if (seeded.current) {
      return;
    }
    seeded.current = true;
    activityToast.current = toast.show(
      {
        operationKey: 'upload',
        loading: true,
        title: 'Uploading archive',
        description: `${initialUpload.name} · You can keep reviewing the import.`,
      },
      { announce: false },
    );
    validationToast.current = toast.show(
      {
        operationKey: 'initial-validation',
        status: 'success',
        title: '28 runbook slugs validated',
        description: 'Zero broken cross-references in core-infra-runbooks-2026-q3.zip.',
        persistent: true,
      },
      { announce: false },
    );
  }, [toast]);
  const readyToCommit = validation === 'verified';
  const totalSize = archives.reduce((sum, archive) => sum + archive.bytes, 0) / 1_000_000;
  const archiveFiles = archives.flatMap(({ file }) => (file ? [file] : []));

  function showImportNotice(description: string, finishUpload = false): void {
    const options = {
      title: 'Archive import',
      description,
      status: 'info' as const,
    };
    if (finishUpload && activityToast.current !== null) {
      if (
        toast.update(activityToast.current, {
          title: options.title,
          description,
          status: options.status,
          loading: false,
        })
      ) {
        if (importToast.current !== null) {
          toast.dismiss(importToast.current);
        }
        importToast.current = activityToast.current;
        activityToast.current = null;
        return;
      }
      activityToast.current = null;
    }
    if (importToast.current === null || !toast.update(importToast.current, options)) {
      importToast.current = toast.show(options);
    }
  }

  function clearActivityNotice(): void {
    if (activityToast.current !== null) {
      toast.dismiss(activityToast.current);
      activityToast.current = null;
    }
  }

  function clearValidationNotice(): void {
    if (validationToast.current !== null) {
      toast.dismiss(validationToast.current);
      validationToast.current = null;
    }
  }

  function clearImportNotice(): void {
    if (importToast.current !== null) {
      toast.dismiss(importToast.current);
      importToast.current = null;
    }
  }

  function invalidateVerification(): void {
    setValidation('required');
    setCurrentStep((step) => (step === 'commit' ? 'verify' : step));
    clearValidationNotice();
    if (readyToCommit) {
      showImportNotice('The import inputs changed. Run another dry-run check.');
    }
  }

  function updateArchives(next: readonly StagedArchive[]): void {
    stagedArchives.current = next;
    setArchives(next);
  }

  function runDryRun(): void {
    const current = stagedArchives.current;
    updateArchives(
      current.map((archive) =>
        archive.state.phase === 'success'
          ? archive
          : { ...archive, state: { phase: 'success', label: 'Archive validated' } },
      ),
    );
    setValidation('verified');
    setCurrentStep('verify');
    clearValidationNotice();
    showImportNotice(
      `Dry-run check complete: ${current.length} staged archives passed validation.`,
      true,
    );
  }

  function reportResult(source: ImportSource, message?: string): void {
    const document = summary.current?.ownerDocument;
    restoreFocus.current =
      document && summary.current?.contains(document.activeElement) ? { source, document } : null;
    setError(message ? { attempt: ++attempt.current, message, source } : null);
  }

  function chooseSchema(files: readonly File[]): void {
    setHasSavedSchema(false);
    setSchema(files);
    invalidateVerification();
    if (files.length === 0) {
      reportResult('schema');
    }
  }

  function receiveArchives({ accepted, rejected }: FileIntakeResult): void {
    // The next drop can arrive before React publishes the previous archive list.
    const current = stagedArchives.current;
    const names = new Set(current.map(({ name }) => name));
    const additions: StagedArchive[] = [];
    let duplicate = rejected.some(({ code }) => code === 'duplicate');
    for (const file of accepted) {
      if (names.has(file.name)) {
        duplicate = true;
        continue;
      }
      names.add(file.name);
      additions.push({
        id: `local:${file.name}`,
        name: file.name,
        bytes: file.size,
        file,
        state: { phase: 'queued', label: 'Queued for validation' },
      });
    }
    if (additions.length > 0) {
      updateArchives([...current, ...additions]);
      invalidateVerification();
    }
    reportResult(
      'archives',
      rejected.some(({ code }) => code !== 'duplicate')
        ? `Choose UTF-8 Markdown or ZIP archives up to ${archiveLimit} each. Unsupported files were not added.`
        : duplicate
          ? 'A staged archive already uses that filename.'
          : undefined,
    );
  }

  return (
    <FolioScene>
      <AppShell
        canvasAs="section"
        minHeight={1380}
        leftRail={<FolioRail active="admin" showBrand />}
        header={
          <Header
            actions={
              <>
                <Button
                  size="s"
                  variant="secondary"
                  tone="neutral"
                  onClick={() => showImportNotice('No completed imports yet.')}
                >
                  Import history
                </Button>
                <Button size="s" disabled={archives.length === 0} onClick={runDryRun}>
                  Run dry-run check
                </Button>
              </>
            }
          >
            <Breadcrumb size="s">
              <BreadcrumbLink href={folioSceneHref('02-workspace-overview')}>
                Platform Eng
              </BreadcrumbLink>
              <span>Administration</span>
              <BreadcrumbPage>Batch archive import</BreadcrumbPage>
            </Breadcrumb>
          </Header>
        }
      >
        <div className="folio-admin-stage folio-import-stage">
          <div className="folio-admin-column">
            <PageIntro
              title="Import Markdown & ADR archives"
              description="Migrate repository-backed Markdown bundles while validating YAML frontmatter, internal links, and owner mappings."
            />
            <Stepper value={currentStep} aria-label="Batch import stages">
              <StepperStep
                value="source"
                label="Source & schema"
                description={hasSchema ? 'Frontmatter rules mapped' : 'Default frontmatter rules'}
                completed
              />
              <StepperStep
                value="verify"
                label="Upload & verify"
                description={`${archives.length} bundles staged`}
                completed={readyToCommit}
              />
              <StepperStep value="commit" label="Commit to space" />
            </Stepper>
            {error && (
              <Alert
                key={error.attempt}
                ref={summary}
                status="danger"
                close={
                  <AlertClose
                    ref={summaryClose}
                    aria-label="Dismiss file validation summary"
                    onClose={() => reportResult(error.source)}
                  />
                }
              >
                <AlertTitle>Check the selected files</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            <Card className="folio-import-card">
              <div className="folio-row folio-between folio-import-card-heading">
                <div className="folio-stack">
                  <Title as="h2" size="body-m" ref={sourceHeading} tabIndex={-1}>
                    1. Schema &amp; duplicate slug policy
                  </Title>
                  <Text size="body-s" color="secondary">
                    Attach a YAML mapping rule set and choose how matching slugs are reconciled.
                  </Text>
                </div>
                <Badge size="s" status={hasSchema ? 'success' : 'neutral'} dot={hasSchema}>
                  {hasSchema ? 'Schema valid' : 'Default rules'}
                </Badge>
              </div>
              <FormField
                label="Frontmatter mapping schema"
                description="Optional YAML mapping for custom status and service tags."
              >
                <FileInput
                  ref={schemaPicker}
                  name="schema"
                  accept=".yaml,.yml"
                  showSize
                  value={schema}
                  onValueChange={chooseSchema}
                  announceIntake={false}
                  onIntake={({ rejected }) =>
                    reportResult(
                      'schema',
                      rejected.length ? 'Choose a YAML mapping schema.' : undefined,
                    )
                  }
                />
              </FormField>
              <FileList aria-label="Saved mapping schema" emptyFocusRef={schemaPicker}>
                {hasSavedSchema && (
                  <FileListItem {...savedSchema} onRemove={() => chooseSchema([])} />
                )}
              </FileList>
              <div className="folio-import-policy">
                <Text id={policyLabelId} size="body-s" weight="medium">
                  Duplicate document slug handling
                </Text>
                <RadioCardGroup
                  className="folio-grid-2"
                  aria-labelledby={policyLabelId}
                  value={policy}
                  onValueChange={(next) => {
                    setPolicy(next);
                    invalidateVerification();
                  }}
                >
                  <RadioCard
                    value="revision"
                    label="Create draft revision on slug match"
                    description="Preserves existing verified runbook until reviewed."
                  />
                  <RadioCard
                    value="skip"
                    label="Skip duplicate document slugs"
                    description="Imports only net-new architecture records."
                  />
                </RadioCardGroup>
              </div>
            </Card>
            <Card className="folio-import-card">
              <div className="folio-row folio-between folio-import-card-heading">
                <div className="folio-stack">
                  <Title as="h2" size="body-m" ref={verificationHeading} tabIndex={-1}>
                    2. Archive bundles &amp; validation queue
                  </Title>
                  <Text size="body-s" color="secondary">
                    Verify links and frontmatter before publishing.
                  </Text>
                </div>
                <Badge size="s">
                  {archives.length} staged · {totalSize.toFixed(1)} MB
                </Badge>
              </div>
              <Dropzone
                ref={archivesPicker}
                size="m"
                name="archives"
                aria-label="Browse files"
                description="Use UTF-8 for Markdown documents."
                accept=".md,.mdx,.zip"
                maxSize={maxArchiveBytes}
                value={archiveFiles}
                announceIntake={false}
                onIntake={receiveArchives}
              />
              <Progress
                value={readyToCommit ? 100 : validation === 'checking' ? 84 : 0}
                label={
                  validation === 'required'
                    ? 'Dry-run validation required'
                    : 'Schema & cross-link validation'
                }
              />
              <FileList aria-label="Staged archives" emptyFocusRef={archivesPicker}>
                {archives.map((archive) => (
                  <FileListItem
                    key={archive.id}
                    name={archive.name}
                    state={archive.state}
                    fileSize={archive.bytes}
                    onRemove={() => {
                      updateArchives(
                        stagedArchives.current.filter((file) => file.id !== archive.id),
                      );
                      if (archive.id === initialUpload.id) {
                        clearActivityNotice();
                      }
                      invalidateVerification();
                    }}
                  />
                ))}
              </FileList>
              <div className="folio-import-footer" ref={footer}>
                <Button
                  size="s"
                  variant="ghost"
                  tone="danger"
                  disabled={archives.length === 0}
                  onClick={() => {
                    updateArchives([]);
                    setCurrentStep('source');
                    setValidation('required');
                    clearValidationNotice();
                    clearActivityNotice();
                    showImportNotice('The staged import was cleared.');
                    sourceHeading.current?.focus();
                  }}
                >
                  Abort import
                </Button>
                <div className="folio-row">
                  <Button
                    size="s"
                    variant="secondary"
                    tone="neutral"
                    iconLeft={ArrowLeftIcon}
                    disabled={currentStep === 'source'}
                    onClick={() => {
                      if (currentStep === 'commit') {
                        setCurrentStep('verify');
                        verificationHeading.current?.focus();
                      } else {
                        setCurrentStep('source');
                        sourceHeading.current?.focus();
                      }
                    }}
                  >
                    Back
                  </Button>
                  {currentStep === 'commit' ? (
                    <Text ref={commitStatus} tabIndex={-1} size="body-s" color="secondary">
                      {archives.length} validated{' '}
                      {archives.length === 1 ? 'archive is' : 'archives are'} ready to import.
                    </Text>
                  ) : (
                    <Button
                      size="s"
                      disabled={!readyToCommit || currentStep !== 'verify'}
                      onClick={() => {
                        setCurrentStep('commit');
                        clearValidationNotice();
                        clearImportNotice();
                      }}
                    >
                      Continue to commit
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
      <FolioToastRegion ref={setViewport} />
    </FolioScene>
  );
}

export default defineScene({
  id: '10-workspace-admin',
  title: 'Workspace Admin & Batch Import',
  group: 'Folio',
  summary:
    'Archive schema mapping, duplicate policies, local file selection, and validation feedback.',
  defaultViewport: 1440,
  uses: [
    'alert',
    'app-shell',
    'badge',
    'breadcrumb',
    'button',
    'card',
    'dropzone',
    'file-input',
    'form-field',
    'icon',
    'indicator',
    'progress',
    'radio-card',
    'stepper',
    'text',
    'title',
    'toast',
  ],
  render: () => (
    <ToastProvider>
      <WorkspaceAdminScene />
    </ToastProvider>
  ),
});
