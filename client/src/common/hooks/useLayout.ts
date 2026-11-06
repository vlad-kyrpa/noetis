import { useSyncExternalStore } from 'react';
import type { LayoutScale } from '../components/Layout/types';

const TABLET_VIEWPORT_WIDTH = 48 * 16;
const PC_VIEWPORT_WIDTH = 75 * 16;

// Classifies the viewport so layouts can choose an appropriate information density.
const getLayoutScale = (): LayoutScale => {
  const viewportWidth = window.innerWidth;

  if (viewportWidth < TABLET_VIEWPORT_WIDTH) {
    return 'mobile';
  }

  return viewportWidth < PC_VIEWPORT_WIDTH ? 'tablet' : 'full';
};

// Provides the safe initial scale used while rendering outside the browser.
const getServerLayoutScale = (): LayoutScale => 'full';

// Registers a listener for viewport changes without owning application state.
const subscribeToViewport = (listener: () => void): (() => void) => {
  window.addEventListener('resize', listener);

  return (): void => window.removeEventListener('resize', listener);
};

// Exposes the current responsive layout scale to shared interface components.
export const useLayout = (): LayoutScale =>
  useSyncExternalStore(subscribeToViewport, getLayoutScale, getServerLayoutScale);
