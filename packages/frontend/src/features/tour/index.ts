/**
 * Tour Feature Exports
 */

// Types
export type {
  Tour,
  TourStep,
  TourPosition,
  TourCategory,
  TourState,
  TourActions,
  TourStore,
  TourContextValue,
  TourTooltipProps,
  TourOverlayProps,
  TourProgressProps,
} from './types';

// Store
export {
  useTourStore,
  useIsTourActive,
  useCurrentTour,
  useCurrentStepIndex,
  useTargetRect,
} from './tourStore';

// Config
export {
  TOURS,
  TOUR_CATEGORIES,
  getTourById,
  getToursByCategory,
} from './tourConfig';

// Components
export { TourProvider } from './components/TourProvider';
export { TourOverlay } from './components/TourOverlay';
export { TourTooltip } from './components/TourTooltip';
export { TourProgress } from './components/TourProgress';
export { TourControls } from './components/TourControls';
export { TourLauncher } from './components/TourLauncher';

// Hooks
export { useTour } from './hooks/useTour';
