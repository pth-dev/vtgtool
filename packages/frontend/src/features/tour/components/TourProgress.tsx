/**
 * Tour Progress Component
 * Visual progress indicator for tour steps
 */

import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import type { TourProgressProps } from '../types';

export const TourProgress: React.FC<TourProgressProps> = ({
  currentStep,
  totalSteps,
  showLabels = false,
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Box sx={{ width: '100%' }}>
      {showLabels && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentStep + 1} / {totalSteps}
          </Typography>
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
          },
        }}
      />
    </Box>
  );
};

// Step dots variant
export const TourProgressDots: React.FC<TourProgressProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center' }}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: index <= currentStep ? '#6366f1' : 'grey.300',
            transition: 'all 0.2s ease',
            transform: index === currentStep ? 'scale(1.25)' : 'scale(1)',
          }}
        />
      ))}
    </Box>
  );
};

export default TourProgress;
