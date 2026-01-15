/**
 * Tour Store
 * Zustand store for managing guided tour state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tour, TourStore } from './types';
import { TOURS } from './tourConfig';

export const useTourStore = create<TourStore>()(
  persist(
    (set, get) => ({
      // State
      currentTour: null,
      currentStepIndex: 0,
      isActive: false,
      completedTours: new Set<string>(),
      isPaused: false,
      targetRect: null,

      // Actions
      startTour: (tourId: string) => {
        const tour = TOURS.find(t => t.id === tourId);
        if (!tour) {
          console.warn(`Tour not found: ${tourId}`);
          return;
        }
        get().startTourFromConfig(tour);
      },

      startTourFromConfig: (tour: Tour) => {
        set({
          currentTour: tour,
          currentStepIndex: 0,
          isActive: true,
          isPaused: false,
          targetRect: null,
        });
      },

      nextStep: () => {
        const { currentTour, currentStepIndex } = get();
        if (!currentTour) return;

        const nextIndex = currentStepIndex + 1;
        if (nextIndex >= currentTour.steps.length) {
          // Tour completed
          get().endTour(true);
        } else {
          // Call onExit for current step
          const currentStep = currentTour.steps[currentStepIndex];
          currentStep.onExit?.();
          
          // Move to next step
          set({ currentStepIndex: nextIndex, targetRect: null });
          
          // Call onEnter for next step
          const nextStep = currentTour.steps[nextIndex];
          nextStep.onEnter?.();
        }
      },

      prevStep: () => {
        const { currentTour, currentStepIndex } = get();
        if (!currentTour || currentStepIndex <= 0) return;

        // Call onExit for current step
        const currentStep = currentTour.steps[currentStepIndex];
        currentStep.onExit?.();

        const prevIndex = currentStepIndex - 1;
        set({ currentStepIndex: prevIndex, targetRect: null });

        // Call onEnter for previous step
        const prevStep = currentTour.steps[prevIndex];
        prevStep.onEnter?.();
      },

      goToStep: (stepIndex: number) => {
        const { currentTour, currentStepIndex } = get();
        if (!currentTour) return;
        if (stepIndex < 0 || stepIndex >= currentTour.steps.length) return;

        // Call onExit for current step
        const currentStep = currentTour.steps[currentStepIndex];
        currentStep.onExit?.();

        set({ currentStepIndex: stepIndex, targetRect: null });

        // Call onEnter for new step
        const newStep = currentTour.steps[stepIndex];
        newStep.onEnter?.();
      },

      endTour: (markComplete = false) => {
        const { currentTour, completedTours } = get();
        
        if (markComplete && currentTour) {
          const newCompleted = new Set(completedTours);
          newCompleted.add(currentTour.id);
          set({ completedTours: newCompleted });
        }

        set({
          currentTour: null,
          currentStepIndex: 0,
          isActive: false,
          isPaused: false,
          targetRect: null,
        });
      },

      pauseTour: () => {
        set({ isPaused: true });
      },

      resumeTour: () => {
        set({ isPaused: false });
      },

      updateTargetRect: (rect: DOMRect | null) => {
        set({ targetRect: rect });
      },

      resetProgress: () => {
        set({
          currentTour: null,
          currentStepIndex: 0,
          isActive: false,
          completedTours: new Set<string>(),
          isPaused: false,
          targetRect: null,
        });
      },

      isTourCompleted: (tourId: string) => {
        return get().completedTours.has(tourId);
      },
    }),
    {
      name: 'vtg-tour-storage',
      partialize: (state) => ({
        // Only persist completed tours
        completedTours: Array.from(state.completedTours),
      }),
      merge: (persisted, current) => ({
        ...current,
        completedTours: new Set((persisted as { completedTours?: string[] })?.completedTours || []),
      }),
    }
  )
);

// Selector hooks for common use cases
export const useIsTourActive = () => useTourStore((state) => state.isActive);
export const useCurrentTour = () => useTourStore((state) => state.currentTour);
export const useCurrentStepIndex = () => useTourStore((state) => state.currentStepIndex);
export const useTargetRect = () => useTourStore((state) => state.targetRect);
