import { warnOnce } from '../../core/devWarning.js';
import type { FileIntakeResult, FileIntakeSource, FileRejection } from './types.js';

type Candidate = { readonly file: File } | { readonly rejection: FileRejection };

interface AdmissionRules {
  readonly accept: string;
  readonly tokens: readonly string[];
  readonly multiple: boolean;
  readonly maxSize: number | undefined;
  readonly maxFiles: number | undefined;
}

interface Admission {
  readonly next: readonly File[];
  readonly result: FileIntakeResult;
}

const mimePart = "[a-z0-9!#$%&'+.^_`|~-]+";
const acceptToken = new RegExp(
  `^(?:\\.[^\\s,/\\\\]+|(?:image|audio|video)/\\*|${mimePart}/${mimePart})$`,
);

function asciiLower(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}

function limit(value: number | undefined, name: 'maxSize' | 'maxFiles'): number | undefined {
  if (
    value === undefined ||
    (Number.isFinite(value) && value >= 0 && (name === 'maxSize' || Number.isInteger(value)))
  ) {
    return value;
  }
  warnOnce(`file-intake-${name}`, `File intake ignores invalid ${name} limits.`);
  return undefined;
}

export function fileRules(
  accept: string | undefined,
  maxSize: number | undefined,
  maxFiles: number | undefined,
  multiple: boolean,
): AdmissionRules {
  const tokens = new Set<string>();
  for (const raw of accept?.split(',') ?? []) {
    const token = asciiLower(raw.trim());
    if (token && acceptToken.test(token)) {
      tokens.add(token);
    } else if (token) {
      warnOnce('file-intake-accept', 'File intake ignores invalid accept tokens.');
    }
  }
  const count = limit(maxFiles, 'maxFiles');
  return {
    multiple,
    accept: [...tokens].join(','),
    tokens: [...tokens],
    maxSize: limit(maxSize, 'maxSize'),
    maxFiles: multiple ? count : Math.min(1, count ?? 1),
  };
}

export function fileCandidates(files: ArrayLike<File>): Candidate[] {
  return Array.from(files, (file) => ({ file }));
}

export function transferCandidates(transfer: DataTransfer): Candidate[] {
  if (!transfer.items?.length) {
    return fileCandidates(transfer.files);
  }
  const candidates: Candidate[] = [];
  for (const item of Array.from(transfer.items)) {
    if (item.kind !== 'file') {
      continue;
    }
    try {
      const entry = item.webkitGetAsEntry?.();
      if (entry?.isDirectory) {
        candidates.push({ rejection: { code: 'directory', file: null, name: entry.name } });
      } else {
        const file = item.getAsFile();
        candidates.push(
          file
            ? { file }
            : { rejection: { code: 'unreadable', file: null, name: entry?.name ?? null } },
        );
      }
    } catch {
      candidates.push({ rejection: { code: 'unreadable', file: null, name: null } });
    }
  }
  return candidates;
}

function sameFile(first: File, second: File): boolean {
  return (
    first.name === second.name &&
    first.size === second.size &&
    first.type === second.type &&
    first.lastModified === second.lastModified
  );
}

function identity(file: File): string {
  return JSON.stringify([file.name, file.size, file.type, file.lastModified]);
}

function matchesType(file: File, tokens: readonly string[]): boolean {
  const name = asciiLower(file.name);
  const type = asciiLower(file.type);
  return (
    tokens.length === 0 ||
    tokens.some((token) => {
      if (token.startsWith('.')) {
        return name.endsWith(token);
      }
      return token.endsWith('/*') ? type.startsWith(token.slice(0, -1)) : type === token;
    })
  );
}

function fileRejection(
  file: File,
  { tokens, maxSize }: AdmissionRules,
  seen: ReadonlySet<string> | undefined,
): FileRejection['code'] | undefined {
  if (!matchesType(file, tokens)) {
    return 'type';
  }
  if (maxSize !== undefined && file.size > maxSize) {
    return 'too-large';
  }
  if (seen?.has(identity(file))) {
    return 'duplicate';
  }
  return undefined;
}

export function admitFiles(
  source: FileIntakeSource,
  candidates: readonly Candidate[],
  chosen: readonly File[],
  rules: AdmissionRules,
): Admission | undefined {
  const first = candidates[0];
  if (
    !first ||
    (!rules.multiple &&
      candidates.length === 1 &&
      'file' in first &&
      chosen[0] &&
      sameFile(first.file, chosen[0]))
  ) {
    return undefined;
  }

  const accepted: File[] = [];
  const rejected: FileRejection[] = [];
  const count = (rules.multiple ? chosen.length : 0) + candidates.length;
  const overflow = rules.maxFiles !== undefined && count > rules.maxFiles;
  const seen = rules.multiple && !overflow ? new Set(chosen.map(identity)) : undefined;
  for (const candidate of candidates) {
    if (overflow) {
      rejected.push({
        code: 'too-many',
        file: 'file' in candidate ? candidate.file : candidate.rejection.file,
        name: 'file' in candidate ? candidate.file.name : candidate.rejection.name,
      });
    } else if ('rejection' in candidate) {
      rejected.push(candidate.rejection);
    } else {
      const { file } = candidate;
      const code = fileRejection(file, rules, seen);
      if (code) {
        rejected.push({ code, file, name: file.name });
      } else {
        accepted.push(file);
        seen?.add(identity(file));
      }
    }
  }
  const next = accepted.length === 0 ? chosen : [...(rules.multiple ? chosen : []), ...accepted];
  return { next, result: { source, accepted, rejected } };
}
