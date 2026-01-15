/**
 * Tour Controls Component
 * Standalone navigation controls that can be placed anywhere
 */

import React from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import {
  SkipNext as SkipIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

interface TourControlsProps {
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onEnd: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  variant?: 'full' | 'compact' | 'minimal';
}

export const TourControls: React.FC<TourControlsProps> = ({
  onNext,
  onPrev,
  onSkip,
  onEnd,
  hasNext,
  hasPrev,
  variant = 'full',
}) => {
  const isLastStep = !hasNext;

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Previous">
          <span>
            <IconButton size="small" onClick={onPrev} disabled={!hasPrev}>
              <PrevIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={isLastStep ? 'Finish' : 'Next'}>
          <IconButton
            size="small"
            onClick={isLastStep ? onEnd : onNext}
            color="primary"
          >
            {isLastStep ? <CheckIcon /> : <NextIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Skip tour">
          <IconButton size="small" onClick={onSkip}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          size="small"
          onClick={onPrev}
          disabled={!hasPrev}
          startIcon={<PrevIcon />}
        >
          Back
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={isLastStep ? onEnd : onNext}
          endIcon={isLastStep ? <CheckIcon /> : <NextIcon />}
        >
          {isLastStep ? 'Done' : 'Next'}
        </Button>
      </Box>
    );
  }

  // Full variant
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Button
        size="small"
        variant="text"
        onClick={onSkip}
        startIcon={<SkipIcon />}
        sx={{ color: 'text.secondary' }}
      >
        Skip tour
      </Button>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={onPrev}
          disabled={!hasPrev}
          startIcon={<PrevIcon />}
        >
          Previous
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={isLastStep ? onEnd : onNext}
          endIcon={isLastStep ? <CheckIcon /> : <NextIcon />}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            },
          }}
        >
          {isLastStep ? 'Finish' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default TourControls;
