/**
 * Tour Provider Component
 * Wraps the app and provides tour context with overlay and tooltip
 */

import React, { useEffect, useCallback } from 'react';
import { TourOverlay } from './TourOverlay';
import { TourTooltip } from './TourTooltip';
import { useTour } from '../hooks/useTour';

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const {
    isActive,
    isPaused,
    currentTour,
    currentStep,
    currentStepIndex,
    targetRect,
    hasNext,
    hasPrev,
    nextStep,
    prevStep,
    endTour,
  } = useTour();

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || isPaused) return;

    switch (event.key) {
      case 'Escape':
        endTour(false);
        break;
      case 'ArrowRight':
      case 'Enter':
        if (hasNext) {
          nextStep();
        } else {
          endTour(true);
        }
        break;
      case 'ArrowLeft':
        if (hasPrev) {
          prevStep();
        }
        break;
    }
  }, [isActive, isPaused, hasNext, hasPrev, nextStep, prevStep, endTour]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle overlay click (skip tour)
  const handleOverlayClick = useCallback(() => {
    // Only end if clicking outside the spotlight
    // The tooltip handles its own clicks
    // endTour(false);
  }, []);

  // Handle tooltip navigation
  const handleNext = useCallback(() => {
    if (hasNext) {
      nextStep();
    } else {
      endTour(true);
    }
  }, [hasNext, nextStep, endTour]);

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      prevStep();
    }
  }, [hasPrev, prevStep]);

  const handleEnd = useCallback(() => {
    endTour(!hasNext); // Mark complete if on last step
  }, [hasNext, endTour]);

  const showTour = isActive && !isPaused && currentTour && currentStep;

  return (
    <>
      {children}
      
      {/* Tour overlay */}
      <TourOverlay
        isVisible={!!showTour}
        targetRect={targetRect}
        spotlightPadding={currentStep?.spotlightPadding ?? 8}
        onClick={handleOverlayClick}
      />
      
      {/* Tour tooltip */}
      {showTour && currentStep && (
        <TourTooltip
          step={currentStep}
          stepNumber={currentStepIndex + 1}
          totalSteps={currentTour.steps.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onEnd={handleEnd}
          hasNext={hasNext}
          hasPrev={hasPrev}
          targetRect={targetRect}
        />
      )}
    </>
  );
};

export default TourProvider;
