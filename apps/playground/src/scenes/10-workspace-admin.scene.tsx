import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { defineScene } from '../workbench/types.js';
import { AppShell, Header, LeftRail } from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import { Card } from '../prototypes/card/card.proto.js';
import { Alert, AlertTitle, AlertDescription } from '../prototypes/alert/alert.proto.js';
import { ToastViewport } from '../prototypes/toast/toast.proto.js';
import { Progress } from '../prototypes/progress/progress.proto.js';
import {
  Dropzone,
  FileInput,
  FileItem,
  FileList,
} from '../prototypes/file-input/file-input.proto.js';
import type { FileItemStatus } from '../prototypes/file-input/file-input.proto.js';
import { RadioCard } from '../prototypes/choice-card/choice-card.proto.js';
import { Stepper } from '../prototypes/stepper/stepper.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
import { Title } from '../prototypes/title/title.proto.js';
import { FolioScene, PageIntro } from './folio/folio.shared.js';
import './folio/folio.settings.css';

interface StagedArchive {
  readonly id: string;
  readonly name: string;
  readonly megabytes: number;
  readonly detail: string;
  readonly status: FileItemStatus;
  readonly progress?: number;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showActivityToast, setShowActivityToast] = useState(true);
  const [showValidationToast, setShowValidationToast] = useState(true);
  const policyName = useId();
  const feedbackRegion = useRef<HTMLDivElement>(null);
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
  const totalSize = archives.reduce((sum, archive) => sum + archive.megabytes, 0);
  const uploadingArchive = archives.find((archive) => archive.status === 'uploading');

  function chooseSchema(files: readonly File[]): void {
    const file = files[0];
    if (!file) {
      return;
    }
    if (!/\.ya?ml$/i.test(file.name)) {
      setError('Choose a YAML mapping schema.');
      return;
    }
    setSchema(file.name);
    setSchemaSize(`${(file.size / 1024).toFixed(1)} KB`);
    setError('');
  }

  function addArchives(files: readonly File[]): void {
    const accepted = files.filter(
      (file) => /\.(?:md|mdx|zip)$/i.test(file.name) && file.size <= 50 * 1024 * 1024,
    );
    setError(
      accepted.length === files.length
        ? ''
        : 'Choose UTF-8 Markdown or ZIP archives up to 50 MB each. Unsupported files were not added.',
    );
    setArchives((current) => [
      ...current,
      ...accepted
        .filter((file) => !current.some((archive) => archive.name === file.name))
        .map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          megabytes: file.size / 1024 / 1024,
          detail: 'Queued for validation',
          status: 'neutral' as const,
        })),
    ]);
  }

  return (
    <FolioScene>
      <AppShell
        minHeight={1380}
        leftRail={<LeftRail active="admin" showBrand />}
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
                <Button
                  size="s"
                  disabled={archives.length === 0}
                  onClick={() => {
                    setNotice(
                      `Dry-run check complete: ${archives.length} archives are staged for validation.`,
                    );
                    setCurrentStep(1);
                  }}
                >
                  Run dry-run check
                </Button>
              </>
            }
          >
            <Breadcrumb size="s">
              <BreadcrumbLink href="?item=02-workspace-overview">Platform Eng</BreadcrumbLink>
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
            <Stepper
              current={currentStep}
              onStepChange={setCurrentStep}
              steps={[
                { label: 'Source & schema', description: 'Frontmatter rules mapped' },
                { label: 'Upload & verify', description: `${archives.length} bundles staged` },
                { label: 'Commit to space', description: 'Publish & index' },
              ]}
            />
            {error && (
              <Alert
                status="danger"
                role="alert"
                onClose={() => setError('')}
                closeLabel="Dismiss file validation summary"
              >
                <AlertTitle>Check the selected files</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Card className="folio-import-card">
              <div className="folio-row folio-between folio-import-card-heading">
                <div className="folio-stack">
                  <Title as="h2" size="body-m">
                    1. Schema &amp; duplicate slug policy
                  </Title>
                  <Text size="body-s" color="secondary">
                    Attach a YAML mapping rule set and choose how matching slugs are reconciled.
                  </Text>
                </div>
                <Badge size="s" status="success" dot>
                  Schema valid
                </Badge>
              </div>
              <FileInput
                accept=".yaml,.yml"
                label="Frontmatter mapping schema"
                fileName={schema}
                fileDetail={schemaSize}
                onFilesChange={chooseSchema}
                onClear={() => {
                  setSchema('');
                  setSchemaSize('');
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
                    onChange={() => setPolicy('revision')}
                    label="Create draft revision on slug match"
                    description="Preserves existing verified runbook until reviewed."
                  />
                  <RadioCard
                    name={policyName}
                    checked={policy === 'skip'}
                    onChange={() => setPolicy('skip')}
                    label="Skip duplicate document slugs"
                    description="Imports only net-new architecture records."
                  />
                </div>
              </div>
            </Card>
            <Card className="folio-import-card">
              <div className="folio-row folio-between folio-import-card-heading">
                <div className="folio-stack">
                  <Title as="h2" size="body-m">
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
              <Progress value={archives.length ? 84 : 0} label="Schema & cross-link validation" />
              <FileList>
                {archives.map((archive) => (
                  <FileItem
                    key={archive.id}
                    name={archive.name}
                    status={archive.status}
                    progress={archive.progress}
                    fileSize={`${archive.megabytes.toFixed(1)} MB`}
                    detail={archive.detail}
                    onRemove={() =>
                      setArchives((current) => current.filter((file) => file.id !== archive.id))
                    }
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
                    setCurrentStep(0);
                    setNotice('The staged import was cleared.');
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
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  >
                    Back
                  </Button>
                  <Button
                    size="s"
                    disabled={archives.length === 0}
                    onClick={() => {
                      setCurrentStep(2);
                      setShowValidationToast(false);
                      setNotice('28 documents prepared for import.');
                    }}
                  >
                    Commit 28 documents
                  </Button>
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
  render: () => <WorkspaceAdminScene />,
});
