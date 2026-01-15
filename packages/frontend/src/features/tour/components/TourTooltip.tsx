/**
 * Tour Tooltip Component
 * Displays step information with navigation controls
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import type { TourTooltipProps, TourPosition } from '../types';

interface TooltipPosition {
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  transform?: string;
}

const TOOLTIP_OFFSET = 16;
const TOOLTIP_WIDTH = 320;

const calculatePosition = (
  targetRect: DOMRect | null,
  position: TourPosition = 'bottom'
): TooltipPosition => {
  if (!targetRect) {
    // Center on screen if no target
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const { top, left, right, bottom, width, height } = targetRect;
  const centerX = left + width / 2;
  const centerY = top + height / 2;

  switch (position) {
    case 'top':
      return {
        bottom: window.innerHeight - top + TOOLTIP_OFFSET,
        left: centerX - TOOLTIP_WIDTH / 2,
      };
    case 'top-start':
      return {
        bottom: window.innerHeight - top + TOOLTIP_OFFSET,
        left: left,
      };
    case 'top-end':
      return {
        bottom: window.innerHeight - top + TOOLTIP_OFFSET,
        left: right - TOOLTIP_WIDTH,
      };
    case 'bottom':
      return {
        top: bottom + TOOLTIP_OFFSET,
        left: centerX - TOOLTIP_WIDTH / 2,
      };
    case 'bottom-start':
      return {
        top: bottom + TOOLTIP_OFFSET,
        left: left,
      };
    case 'bottom-end':
      return {
        top: bottom + TOOLTIP_OFFSET,
        left: right - TOOLTIP_WIDTH,
      };
    case 'left':
      return {
        top: centerY,
        right: window.innerWidth - left + TOOLTIP_OFFSET,
        transform: 'translateY(-50%)',
      };
    case 'left-start':
      return {
        top: top,
        right: window.innerWidth - left + TOOLTIP_OFFSET,
      };
    case 'left-end':
      return {
        top: bottom,
        right: window.innerWidth - left + TOOLTIP_OFFSET,
        transform: 'translateY(-100%)',
      };
    case 'right':
      return {
        top: centerY,
        left: right + TOOLTIP_OFFSET,
        transform: 'translateY(-50%)',
      };
    case 'right-start':
      return {
        top: top,
        left: right + TOOLTIP_OFFSET,
      };
    case 'right-end':
      return {
        top: bottom,
        left: right + TOOLTIP_OFFSET,
        transform: 'translateY(-100%)',
      };
    default:
      return {
        top: bottom + TOOLTIP_OFFSET,
        left: centerX - TOOLTIP_WIDTH / 2,
      };
  }
};

export const TourTooltip: React.FC<TourTooltipProps> = ({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onEnd,
  hasNext,
  hasPrev,
  targetRect,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({});
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay visibility for smooth entrance
    if (targetRect) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [targetRect]);

  useEffect(() => {
    const pos = calculatePosition(targetRect, step.position);
    
    // Ensure tooltip stays within viewport
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedPos = { ...pos };

      // Horizontal adjustments
      if (pos.left !== undefined && typeof pos.left === 'number') {
        if (pos.left < 16) {
          adjustedPos.left = 16;
        } else if (pos.left + TOOLTIP_WIDTH > viewportWidth - 16) {
          adjustedPos.left = viewportWidth - TOOLTIP_WIDTH - 16;
        }
      }

      // Vertical adjustments
      if (pos.top !== undefined && typeof pos.top === 'number') {
        if (pos.top < 16) {
          adjustedPos.top = 16;
        } else if (pos.top + rect.height > viewportHeight - 16) {
          adjustedPos.top = viewportHeight - rect.height - 16;
        }
      }

      setTooltipPosition(adjustedPos);
    } else {
      setTooltipPosition(pos);
    }
  }, [targetRect, step.position]);

  const isLastStep = !hasNext;

  return (
    <Paper
      ref={tooltipRef}
      elevation={8}
      sx={{
        position: 'fixed',
        width: TOOLTIP_WIDTH,
        zIndex: 9999,
        borderRadius: 2,
        overflow: 'hidden',
        opacity: isVisible && targetRect ? 1 : 0,
        transform: isVisible ? undefined : 'scale(0.95)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, opacity, top, left',
        ...tooltipPosition,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {step.title}
        </Typography>
        <IconButton
          size="small"
          onClick={onEnd}
          sx={{ color: 'white', ml: 1, p: 0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {step.content}
        </Typography>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'grey.50',
        }}
      >
        {/* Step indicator */}
        <Typography variant="caption" color="text.secondary">
          Step {stepNumber} of {totalSteps}
        </Typography>

        {/* Navigation buttons */}
        <Stack direction="row" spacing={1}>
          {hasPrev && (
            <Button
              size="small"
              variant="outlined"
              onClick={onPrev}
              startIcon={<ArrowBackIcon />}
              sx={{ minWidth: 'auto', px: 1.5 }}
            >
              Back
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={isLastStep ? onEnd : onNext}
            endIcon={!isLastStep && <ArrowForwardIcon />}
            sx={{
              minWidth: 'auto',
              px: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              },
            }}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default TourTooltip;
