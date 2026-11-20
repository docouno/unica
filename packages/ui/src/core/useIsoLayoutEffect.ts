import { useEffect, useLayoutEffect } from 'react';

export const useIsoLayoutEffect: typeof useLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;
