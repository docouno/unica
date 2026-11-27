import { describe, expect, it } from 'vitest';
import {
  admitFiles,
  fileCandidates,
  fileRules,
  transferCandidates,
} from '../src/components/FileInput/admission.js';

function file(name: string, bytes = 'payload', type = '', lastModified = 1): File {
  return new File([bytes], name, { type, lastModified });
}

describe('file admission', () => {
  it('checks the raw count before individually rejecting type, bytes or duplicates', () => {
    const kept = file('base.md');
    const addition = file('new.md');
    const wrongType = file('wrong.txt');
    const huge = file('large.md', 'long payload');
    const chosen = [kept];
    const candidates = fileCandidates([wrongType, addition, huge, addition]);
    const mixed = admitFiles('drop', candidates, chosen, fileRules('.md', 7, 5, true));

    expect(mixed?.next).toEqual([kept, addition]);
    expect(mixed?.result).toEqual({
      source: 'drop',
      accepted: [addition],
      rejected: [
        { code: 'type', file: wrongType, name: 'wrong.txt' },
        { code: 'too-large', file: huge, name: 'large.md' },
        { code: 'duplicate', file: addition, name: 'new.md' },
      ],
    });

    const overflow = admitFiles('drop', candidates, chosen, fileRules('.md', 7, 4, true));
    expect(overflow?.next).toBe(chosen);
    expect(overflow?.result.accepted).toEqual([]);
    expect(overflow?.result.rejected.map(({ code }) => code)).toEqual(Array(4).fill('too-many'));
  });

  it('preserves the same single file across selection sources and a later rule change', () => {
    const old = file('old.md', 'old file');
    const reselect = file('old.md', 'old file');
    const replacement = file('new.md');
    const chosen = [old];
    const rules = fileRules('.zip', 0, 0, false);
    for (const source of ['picker', 'drop', 'paste'] as const) {
      expect(admitFiles(source, fileCandidates([reselect]), chosen, rules)).toBeUndefined();
    }
    expect(
      admitFiles('paste', fileCandidates([replacement]), chosen, rules)?.result.rejected[0]?.code,
    ).toBe('too-many');
    expect(
      admitFiles('drop', fileCandidates([old, reselect]), chosen, rules)?.result.rejected,
    ).toHaveLength(2);
    expect(
      admitFiles('drop', fileCandidates([replacement]), chosen, fileRules('.md', 7, 5, false))
        ?.next,
    ).toEqual([replacement]);
    expect(fileRules('.md', undefined, 5, false).maxFiles).toBe(1);
  });

  it('matches normalized extensions, specific MIME types and media wildcards', () => {
    const empty = file('ARCHIVE.TAR.GZ', '');
    const image = file('image', 'data', 'IMAGE/JPEG');
    const word = file('filename', 'abc', 'text/plain');
    const zipped = file('secret.zip', 'abc', 'application/zip');
    const rules = fileRules(' .TAR.GZ, IMAGE/*, text/plain, IMAGE/* ', 4, undefined, true);
    expect(rules.accept).toBe('.tar.gz,image/*,text/plain');
    const result = admitFiles('picker', fileCandidates([empty, image, word, zipped]), [], rules);
    expect(result?.result.accepted).toEqual([empty, image, word]);
    expect(result?.result.rejected).toEqual([{ code: 'type', file: zipped, name: zipped.name }]);
    expect(
      admitFiles('drop', fileCandidates([empty]), [], fileRules(undefined, 0, 1, true))?.next[0],
    ).toBe(empty);
  });

  it('uses the four identity fields instead of a name or payload comparison', () => {
    const first = file('one.md', 'test', 'text/plain', 1);
    const equal = file('one.md', 'next', 'text/plain', 1);
    const differentType = file('one.md', 'test', 'text/markdown', 1);
    const differentTime = file('one.md', 'test', 'text/plain', 2);
    const differentSize = file('one.md', 'test!', 'text/plain', 1);
    const chosen = [first];
    const candidates = fileCandidates([equal, differentType, differentTime, differentSize]);
    const result = admitFiles('drop', candidates, chosen, fileRules(undefined, undefined, 5, true));
    expect(result?.next).toEqual([first, differentType, differentTime, differentSize]);
    expect(result?.result.rejected).toEqual([{ code: 'duplicate', file: equal, name: equal.name }]);
  });

  it('counts top-level directories and unreadable file items without reading strings', () => {
    const unnamed = file('zero.md', '');
    const items = [
      { kind: 'string' },
      {
        kind: 'file',
        webkitGetAsEntry: () => ({ isDirectory: true, name: 'notes' }),
        getAsFile: () => {
          throw new Error('Do not read a directory');
        },
      },
      {
        kind: 'file',
        webkitGetAsEntry: () => ({ isDirectory: false, name: 'unreadable.md' }),
        getAsFile: () => null,
      },
      { kind: 'file', webkitGetAsEntry: () => null, getAsFile: () => unnamed },
    ];
    const candidates = transferCandidates({ items, files: [] } as unknown as DataTransfer);
    const rules = fileRules('.md', 0, 3, true);
    expect(admitFiles('paste', candidates, [], rules)?.result).toEqual({
      source: 'paste',
      accepted: [unnamed],
      rejected: [
        { code: 'directory', file: null, name: 'notes' },
        { code: 'unreadable', file: null, name: 'unreadable.md' },
      ],
    });
    expect(transferCandidates({ items: [], files: [unnamed] } as unknown as DataTransfer)).toEqual([
      { file: unnamed },
    ]);
  });
});
