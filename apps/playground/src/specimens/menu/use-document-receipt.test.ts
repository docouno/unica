import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { documentLink, useDocumentReceipt } from './use-document-receipt.js';

it('keeps a newer menu receipt when an earlier clipboard write finishes', async () => {
  let finishCopy!: () => void;
  const pending = new Promise<void>((resolve) => {
    finishCopy = resolve;
  });
  const writeText = vi.fn().mockReturnValue(pending);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  try {
    const { result } = renderHook(useDocumentReceipt);
    act(() => result.current.copyLink());
    expect(writeText).toHaveBeenCalledWith(documentLink);
    act(() => result.current.report('Rename requested.'));
    await act(async () => {
      finishCopy();
      await pending;
    });
    expect(result.current.receipt).toBe('Rename requested.');
  } finally {
    vi.unstubAllGlobals();
  }
});
