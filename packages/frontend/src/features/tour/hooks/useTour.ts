/**
 * useTour Hook
 * Custom hook for interacting with the tour system
 */

import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useTourStore } from '../tourStore';
import { getTourById } from '../tourConfig';
import type { Tour, TourStep } from '../types';

export const useTour = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    currentTour,
    currentStepIndex,
    isActive,
    isPaused,
    completedTours,
    targetRect,
    startTourFromConfig,
    nextStep,
    prevStep,
    goToStep,
    endTour,
    pauseTour,
    resumeTour,
    updateTargetRect,
    resetProgress,
    isTourCompleted,
  } = useTourStore();

  // Get current step configuration
  const getCurrentStep = useCallback((): TourStep | null => {
    if (!currentTour || currentStepIndex >= currentTour.steps.length) {
      return null;
    }
    return currentTour.steps[currentStepIndex];
  }, [currentTour, currentStepIndex]);

  // Check if there's a next step
  const hasNextStep = useCallback((): boolean => {
    if (!currentTour) return false;
    return currentStepIndex < currentTour.steps.length - 1;
  }, [currentTour, currentStepIndex]);

  // Check if there's a previous step
  const hasPrevStep = useCallback((): boolean => {
    return currentStepIndex > 0;
  }, [currentStepIndex]);

  // Get progress percentage
  const getProgress = useCallback((): number => {
    if (!currentTour || currentTour.steps.length === 0) return 0;
    return ((currentStepIndex + 1) / currentTour.steps.length) * 100;
  }, [currentTour, currentStepIndex]);

  // Handle navigation when step requires route change
  const handleStepNavigation = useCallback(async () => {
    const step = getCurrentStep();
    if (!step?.route) return;

    const currentPath = location.pathname;
    if (currentPath !== step.route) {
      await navigate({ to: step.route });
      // Small delay to let the page render
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [getCurrentStep, location.pathname, navigate]);

  // Find and highlight target element
  const findAndHighlightTarget = useCallback(() => {
    const step = getCurrentStep();
    if (!step) {
      updateTargetRect(null);
      return;
    }

    const targetElement = document.querySelector(`[data-tour-id="${step.target}"]`);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      updateTargetRect(rect);

      // Scroll element into view if needed (with smooth behavior)
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    } else {
      console.warn(`Tour target not found: ${step.target}`);
      updateTargetRect(null);
    }
  }, [getCurrentStep, updateTargetRect]);

  // Update target rect on step change or resize
  useEffect(() => {
    if (!isActive || isPaused) return;

    // Navigate if needed, then find target
    const init = async () => {
      await handleStepNavigation();
      // Wait for navigation, DOM updates and animations
      setTimeout(findAndHighlightTarget, 400);
    };

    init();

    // Update on resize/scroll with debounce for performance
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(findAndHighlightTarget, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isActive, isPaused, currentStepIndex, handleStepNavigation, findAndHighlightTarget]);

  // Enhanced next step with navigation
  const goNext = useCallback(async () => {
    nextStep();
  }, [nextStep]);

  // Enhanced prev step with navigation
  const goPrev = useCallback(async () => {
    prevStep();
  }, [prevStep]);

  // Start tour by ID with validation
  const startTourById = useCallback((tourId: string): boolean => {
    const tour = getTourById(tourId);
    if (!tour) {
      console.warn(`Tour not found: ${tourId}`);
      return false;
    }

    // Check prerequisites
    if (tour.prerequisites?.length) {
      const unmetPrereqs = tour.prerequisites.filter(id => !isTourCompleted(id));
      if (unmetPrereqs.length > 0) {
        console.warn(`Prerequisites not met for tour ${tourId}:`, unmetPrereqs);
        // Still allow starting, but warn
      }
    }

    startTourFromConfig(tour);
    return true;
  }, [isTourCompleted, startTourFromConfig]);

  // Get recommended tour based on user state
  const getRecommendedTour = useCallback((): Tour | null => {
    // If quick-start not done, recommend it
    if (!isTourCompleted('quick-start')) {
      return getTourById('quick-start') || null;
    }

    // Find first uncompleted tour
    const tours = ['dashboard-deep-dive', 'data-management', 'isc-tracking', 'ai-chat-mastery'];
    for (const tourId of tours) {
      if (!isTourCompleted(tourId)) {
        return getTourById(tourId) || null;
      }
    }

    return null;
  }, [isTourCompleted]);

  return {
    // State
    currentTour,
    currentStepIndex,
    isActive,
    isPaused,
    completedTours,
    targetRect,
    
    // Computed
    currentStep: getCurrentStep(),
    hasNext: hasNextStep(),
    hasPrev: hasPrevStep(),
    progress: getProgress(),
    
    // Actions
    startTour: startTourById,
    startTourFromConfig,
    nextStep: goNext,
    prevStep: goPrev,
    goToStep,
    endTour,
    pauseTour,
    resumeTour,
    resetProgress,
    isTourCompleted,
    
    // Helpers
    getCurrentStep,
    hasNextStep,
    hasPrevStep,
    getProgress,
    getRecommendedTour,
    findAndHighlightTarget,
  };
};

export default useTour;
