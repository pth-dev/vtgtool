/**
 * Tour Overlay Component
 * Semi-transparent overlay with spotlight effect to highlight tour elements
 */

import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { TourOverlayProps } from '../types';

export const TourOverlay: React.FC<TourOverlayProps> = ({
  isVisible,
  targetRect,
  spotlightPadding = 8,
  onClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Animated values for smooth transitions
  const [animatedRect, setAnimatedRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Update SVG dimensions on resize
    const handleResize = () => {
      if (svgRef.current) {
        svgRef.current.setAttribute('width', `${window.innerWidth}px`);
        svgRef.current.setAttribute('height', `${window.innerHeight}px`);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth transition for spotlight position
  useEffect(() => {
    if (targetRect) {
      // Use double RAF for smoother animation (after paint)
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => {
          setAnimatedRect(targetRect);
        });
        return () => cancelAnimationFrame(frame2);
      });
      return () => cancelAnimationFrame(frame1);
    } else {
      setAnimatedRect(null);
    }
  }, [targetRect]);

  if (!isVisible) return null;

  // Calculate spotlight cutout using animated rect
  const spotlightX = animatedRect ? animatedRect.left - spotlightPadding : 0;
  const spotlightY = animatedRect ? animatedRect.top - spotlightPadding : 0;
  const spotlightWidth = animatedRect ? animatedRect.width + spotlightPadding * 2 : 0;
  const spotlightHeight = animatedRect ? animatedRect.height + spotlightPadding * 2 : 0;
  const borderRadius = 8;

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        pointerEvents: 'auto',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <svg
        ref={svgRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <defs>
          {/* Mask for spotlight cutout */}
          <mask id="tour-spotlight-mask">
            {/* White = visible, Black = transparent */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {animatedRect && (
              <rect
                x={spotlightX}
                y={spotlightY}
                width={spotlightWidth}
                height={spotlightHeight}
                rx={borderRadius}
                ry={borderRadius}
                fill="black"
                style={{ 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'x, y, width, height',
                }}
              />
            )}
          </mask>

          {/* Glow effect for spotlight */}
          <filter id="tour-spotlight-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#6366f1" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dark overlay with cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={alpha('#000', 0.7)}
          mask="url(#tour-spotlight-mask)"
        />

        {/* Spotlight border/glow */}
        {animatedRect && (
          <rect
            x={spotlightX}
            y={spotlightY}
            width={spotlightWidth}
            height={spotlightHeight}
            rx={borderRadius}
            ry={borderRadius}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            filter="url(#tour-spotlight-glow)"
            style={{ 
              pointerEvents: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'x, y, width, height',
            }}
          />
        )}
      </svg>
    </Box>
  );
};

export default TourOverlay;
