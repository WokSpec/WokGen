'use client';
import { useEffect } from 'react';
import type { WAPAction } from '@/lib/wap';

type WAPHandler = (action: WAPAction) => void;

export function useWAPListener(handler: WAPHandler, deps: React.DependencyList = []) {
  useEffect(() => {
    const listener = (e: Event) => {
      const action = (e as CustomEvent<WAPAction>).detail;
      handler(action);
    };
    window.addEventListener('wokgen:action', listener);
    return () => window.removeEventListener('wokgen:action', listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
