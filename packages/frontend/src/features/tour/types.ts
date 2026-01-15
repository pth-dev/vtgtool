/**
 * Tour Feature Types
 * Type definitions for the guided tour system
 */

export type TourPosition = 
  | 'top' 
  | 'top-start' 
  | 'top-end' 
  | 'bottom' 
  | 'bottom-start' 
  | 'bottom-end' 
  | 'left' 
  | 'left-start' 
  | 'left-end' 
  | 'right' 
  | 'right-start' 
  | 'right-end';

export interface TourStep {
  /** Unique identifier for the step */
  id: string;
  /** Target element selector (data-tour-id value) */
  target: string;
  /** Step title */
  title: string;
  /** Step description/content */
  content: string;
  /** Tooltip position relative to target */
  position?: TourPosition;
  /** Optional route to navigate before showing step */
  route?: string;
  /** Spotlight padding around the target element */
  spotlightPadding?: number;
  /** Whether to allow interaction with the target element */
  allowInteraction?: boolean;
  /** Custom action on step enter */
  onEnter?: () => void;
  /** Custom action on step exit */
  onExit?: () => void;
}

export interface Tour {
  /** Unique tour identifier */
  id: string;
  /** Tour name for display */
  name: string;
  /** Tour description */
  description: string;
  /** Tour category for grouping */
  category: TourCategory;
  /** Array of tour steps */
  steps: TourStep[];
  /** Icon for the tour (MUI icon name) */
  icon?: string;
  /** Estimated time to complete in minutes */
  estimatedTime?: number;
  /** Prerequisites - other tour IDs that should be completed first */
  prerequisites?: string[];
}

export type TourCategory = 
  | 'getting-started'
  | 'dashboard'
  | 'data-management'
  | 'isc-tracking'
  | 'ai-chat';

export interface TourState {
  /** Currently active tour */
  currentTour: Tour | null;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Whether a tour is currently active */
  isActive: boolean;
  /** Set of completed tour IDs */
  completedTours: Set<string>;
  /** Whether tour is paused (e.g., user opened a modal) */
  isPaused: boolean;
  /** Target element rect for spotlight */
  targetRect: DOMRect | null;
}

export interface TourActions {
  /** Start a specific tour */
  startTour: (tourId: string) => void;
  /** Start a tour from Tour object */
  startTourFromConfig: (tour: Tour) => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Skip to specific step */
  goToStep: (stepIndex: number) => void;
  /** End current tour */
  endTour: (markComplete?: boolean) => void;
  /** Pause tour */
  pauseTour: () => void;
  /** Resume tour */
  resumeTour: () => void;
  /** Update target element rect */
  updateTargetRect: (rect: DOMRect | null) => void;
  /** Reset all tour progress */
  resetProgress: () => void;
  /** Check if a tour is completed */
  isTourCompleted: (tourId: string) => boolean;
}

export type TourStore = TourState & TourActions;

export interface TourContextValue {
  /** Current tour store state and actions */
  store: TourStore;
  /** Get current step configuration */
  getCurrentStep: () => TourStep | null;
  /** Check if there's a next step */
  hasNextStep: () => boolean;
  /** Check if there's a previous step */
  hasPrevStep: () => boolean;
  /** Get progress percentage */
  getProgress: () => number;
}

export interface TourTooltipProps {
  /** Current step configuration */
  step: TourStep;
  /** Current step number (1-based for display) */
  stepNumber: number;
  /** Total number of steps */
  totalSteps: number;
  /** Callback for next step */
  onNext: () => void;
  /** Callback for previous step */
  onPrev: () => void;
  /** Callback to end tour */
  onEnd: () => void;
  /** Whether there's a next step */
  hasNext: boolean;
  /** Whether there's a previous step */
  hasPrev: boolean;
  /** Target element position */
  targetRect: DOMRect | null;
}

export interface TourOverlayProps {
  /** Whether overlay is visible */
  isVisible: boolean;
  /** Target element rect for spotlight cutout */
  targetRect: DOMRect | null;
  /** Spotlight padding */
  spotlightPadding?: number;
  /** Click handler for overlay (usually to close tour) */
  onClick?: () => void;
}

export interface TourProgressProps {
  /** Current step (0-based) */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Whether to show step labels */
  showLabels?: boolean;
}
