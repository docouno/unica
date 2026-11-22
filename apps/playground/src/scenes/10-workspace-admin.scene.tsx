import { useId, useLayoutEffect, useRef, useState } from 'react';
import { folioSceneHref } from './folio/folio.routes.js';
import type { ReactElement } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { defineScene } from '../workbench/types.js';
import { AppShell, Header } from '../prototypes/app-shell/app-shell.proto.js';
import {
  Alert,
  AlertClose,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  Progress,
  Text,
  Title,
} from '@docouno/unica';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import { ToastViewport } from '../prototypes/toast/toast.proto.js';
import {
  Dropzone,
  FileInput,
  FileItem,
  FileList,
} from '../prototypes/file-input/file-input.proto.js';
import type { FileItemStatus } from '../prototypes/file-input/file-input.proto.js';
import { RadioCard } from '../prototypes/choice-card/choice-card.proto.js';
import { Stepper, StepperStep } from '../prototypes/stepper/stepper.proto.js';
import { FolioRail, FolioScene, PageIntro } from './folio/folio.shared.js';
import './folio/folio.settings.css';

interface StagedArchive {
  readonly id: string;
  readonly name: string;
  readonly megabytes: number;
  readonly detail: string;
  readonly status: FileItemStatus;
  readonly progress?: number;
}

type ImportSource = 'schema' | 'archives';

interface ImportError {
  readonly attempt: number;
  readonly message: string;
  readonly source: ImportSource;
}

function isSchema(file: File): boolean {
  return /\.ya?ml$/i.test(file.name);
}

const initialArchives: readonly StagedArchive[] = [
  {
    id: 'runbooks',
    name: 'core-infra-runbooks-2026-q3.zip',
    megabytes: 18.2,
    detail: '28 docs verified',
    status: 'success',
  },
  {
    id: 'rfcs',
    name: 'legacy-envoy-rfcs.zip',
    megabytes: 6.4,
    detail: 'Uploading archive…',
    status: 'uploading',
    progress: 65,
  },
];

function WorkspaceAdminScene(): ReactElement {
  const [schema, setSchema] = useState('folio-adr-schema-v3.yaml');
  const [schemaSize, setSchemaSize] = useState('18.4 KB');
  const [policy, setPolicy] = useState('revision');
  const [archives, setArchives] = useState<readonly StagedArchive[]>(initialArchives);
  const [currentStep, setCurrentStep] = useState<'source' | 'verify' | 'commit'>('verify');
  const [validation, setValidation] = useState<'checking' | 'required' | 'verified'>('checking');
  const [error, setError] = useState<ImportError | null>(null);
  const [notice, setNotice] = useState('');
  const [showActivityToast, setShowActivityToast] = useState(true);
  const [showValidationToast, setShowValidationToast] = useState(true);
  const policyName = useId();
  const attempt = useRef(0);
  const summary = useRef<HTMLDivElement>(null);
  const summaryClose = useRef<HTMLButtonElement>(null);
  const schemaCard = useRef<HTMLDivElement>(null);
  const archivesCard = useRef<HTMLDivElement>(null);
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
      schemaCard.current?.querySelector('button')?.focus();
    } else {
      archivesCard.current?.querySelector<HTMLInputElement>('input[type="file"]')?.focus();
    }
  }, [error]);

  const feedbackRegion = useRef<HTMLDivElement>(null);
  const sourceHeading = useRef<HTMLHeadingElement>(null);
  const verificationHeading = useRef<HTMLHeadingElement>(null);
  const commitStatus = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    if (currentStep === 'commit') {
      commitStatus.current?.focus();
    }
  }, [currentStep]);

  useLayoutEffect(() => {
    const region = feedbackRegion.current;
    const scene = region?.closest<HTMLElement>('.folio-scene');
    if (!scene) {
      return;
    }
    const viewport = region?.querySelector<HTMLElement>('.toast-viewport');
    const update = (): void =>
      scene.style.setProperty(
        '--folio-toast-clearance',
        `${viewport ? Math.ceil(viewport.getBoundingClientRect().height) + 48 : 64}px`,
      );
    const observer = new ResizeObserver(update);
    if (viewport) {
      observer.observe(viewport);
    }
    update();
    return () => observer.disconnect();
  }, [archives, notice, showActivityToast, showValidationToast]);
  const readyToCommit = validation === 'verified';
  const totalSize = archives.reduce((sum, archive) => sum + archive.megabytes, 0);
  const uploadingArchive = archives.find((archive) => archive.status === 'uploading');

  function invalidateVerification(): void {
    setValidation('required');
    setCurrentStep((step) => (step === 'commit' ? 'verify' : step));
    setShowValidationToast(false);
    if (readyToCommit) {
      setNotice('The import inputs changed. Run another dry-run check.');
    }
  }

  function runDryRun(): void {
    setArchives((current) =>
      current.map((archive) =>
        archive.status === 'success'
          ? archive
          : {
              id: archive.id,
              name: archive.name,
              megabytes: archive.megabytes,
              detail: 'Archive validated',
              status: 'success',
            },
      ),
    );
    setValidation('verified');
    setCurrentStep('verify');
    setShowValidationToast(false);
    setNotice(`Dry-run check complete: ${archives.length} staged archives passed validation.`);
  }

  function reportResult(source: ImportSource, message?: string): void {
    const document = summary.current?.ownerDocument;
    restoreFocus.current =
      document && summary.current?.contains(document.activeElement) ? { source, document } : null;
    setError(message ? { attempt: ++attempt.current, message, source } : null);
  }

  function chooseSchema(files: readonly File[]): void {
    const file = files[0];
    if (!file) {
      return;
    }
    if (!isSchema(file)) {
      reportResult('schema', 'Choose a YAML mapping schema.');
      return;
    }
    setSchema(file.name);
    invalidateVerification();
    setSchemaSize(`${(file.size / 1024).toFixed(1)} KB`);
    reportResult('schema');
  }

  function addArchives(files: readonly File[]): void {
    const accepted = files.filter(
      (file) => /\.(?:md|mdx|zip)$/i.test(file.name) && file.size <= 50 * 1024 * 1024,
    );
    reportResult(
      'archives',
      accepted.length !== files.length
        ? 'Choose UTF-8 Markdown or ZIP archives up to 50 MB each. Unsupported files were not added.'
        : undefined,
    );
    const additions = accepted
      .filter((file) => !archives.some((archive) => archive.name === file.name))
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        megabytes: file.size / 1024 / 1024,
        detail: 'Queued for validation',
        status: 'neutral' as const,
      }));
    if (additions.length > 0) {
      setArchives((current) => [...current, ...additions]);
      invalidateVerification();
    }
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
                  onClick={() => setNotice('No completed imports yet.')}
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
            <Stepper value={currentStep} label="Batch import stages">
              <StepperStep
                value="source"
                label="Source & schema"
                description={schema ? 'Frontmatter rules mapped' : 'Default frontmatter rules'}
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
            <Card ref={schemaCard} className="folio-import-card">
              <div className="folio-row folio-between folio-import-card-heading">
                <div className="folio-stack">
                  <Title as="h2" size="body-m" ref={sourceHeading} tabIndex={-1}>
                    1. Schema &amp; duplicate slug policy
                  </Title>
                  <Text size="body-s" color="secondary">
                    Attach a YAML mapping rule set and choose how matching slugs are reconciled.
                  </Text>
                </div>
                <Badge size="s" status={schema ? 'success' : 'neutral'} dot={Boolean(schema)}>
                  {schema ? 'Schema valid' : 'Default rules'}
                </Badge>
              </div>
              <FileInput
                accept=".yaml,.yml"
                label="Frontmatter mapping schema"
                fileName={schema}
                fileDetail={schemaSize}
                onFilesChange={chooseSchema}
                onChange={({ currentTarget }) => {
                  const file = currentTarget.files?.[0];
                  if (file && !isSchema(file)) {
                    currentTarget.value = '';
                  }
                }}
                onClear={() => {
                  setSchema('');
                  setSchemaSize('');
                  invalidateVerification();
                }}
                description="Optional YAML mapping for custom status and service tags."
              />
              <div
                className="folio-import-policy"
                role="group"
                aria-label="Duplicate document slug handling"
              >
                <Text size="body-s" weight="medium">
                  Duplicate document slug handling
                </Text>
                <div className="folio-grid-2">
                  <RadioCard
                    name={policyName}
                    checked={policy === 'revision'}
                    onChange={() => {
                      setPolicy('revision');
                      invalidateVerification();
                    }}
                    label="Create draft revision on slug match"
                    description="Preserves existing verified runbook until reviewed."
                  />
                  <RadioCard
                    name={policyName}
                    checked={policy === 'skip'}
                    onChange={() => {
                      setPolicy('skip');
                      invalidateVerification();
                    }}
                    label="Skip duplicate document slugs"
                    description="Imports only net-new architecture records."
                  />
                </div>
              </div>
            </Card>
            <Card ref={archivesCard} className="folio-import-card">
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
                size="m"
                description=".md and .mdx (UTF-8), or .zip · 50 MB max per file"
                accept=".md,.mdx,.zip"
                onFilesChange={addArchives}
              />
              <Progress
                value={readyToCommit ? 100 : validation === 'checking' ? 84 : 0}
                label={
                  validation === 'required'
                    ? 'Dry-run validation required'
                    : 'Schema & cross-link validation'
                }
              />
              <FileList>
                {archives.map((archive) => (
                  <FileItem
                    key={archive.id}
                    name={archive.name}
                    status={archive.status}
                    progress={archive.progress}
                    fileSize={`${archive.megabytes.toFixed(1)} MB`}
                    detail={archive.detail}
                    onRemove={() => {
                      setArchives((current) => current.filter((file) => file.id !== archive.id));
                      invalidateVerification();
                    }}
                  />
                ))}
              </FileList>
              <div className="folio-import-footer">
                <Button
                  size="s"
                  variant="ghost"
                  tone="danger"
                  disabled={archives.length === 0}
                  onClick={() => {
                    setArchives([]);
                    setCurrentStep('source');
                    setValidation('required');
                    setShowValidationToast(false);
                    setNotice('The staged import was cleared.');
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
                        setShowValidationToast(false);
                        setNotice('');
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
      <div className="folio-import-toast-region" ref={feedbackRegion}>
        <ToastViewport
          items={[
            ...(showActivityToast && uploadingArchive
              ? [
                  {
                    id: 'activity',
                    loading: true,
                    title: 'Uploading archive',
                    children: `${uploadingArchive.name} · You can keep reviewing the import.`,
                  },
                ]
              : []),
            ...(showValidationToast
              ? [
                  {
                    id: 'validation',
                    status: 'success' as const,
                    title: '28 runbook slugs validated',
                    children: 'Zero broken cross-references in core-infra-runbooks-2026-q3.zip.',
                  },
                ]
              : []),
            ...(notice
              ? [
                  {
                    id: 'import-notice',
                    status: 'info' as const,
                    title: 'Archive import',
                    children: notice,
                  },
                ]
              : []),
          ]}
          onDismiss={(id) => {
            if (id === 'activity') {
              setShowActivityToast(false);
            } else if (id === 'validation') {
              setShowValidationToast(false);
            } else {
              setNotice('');
            }
          }}
          onDismissAll={() => {
            setShowActivityToast(false);
            setShowValidationToast(false);
            setNotice('');
          }}
        />
      </div>
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
    'icon',
    'indicator',
    'progress',
    'radio-card',
    'stepper',
    'text',
    'title',
    'toast',
  ],
  render: WorkspaceAdminScene,
});
