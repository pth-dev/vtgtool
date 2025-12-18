import { useEffect, useRef } from 'react'

import { Box } from '@mui/material'

import anime from 'animejs'

// Image paths
const LOGO_FULL = '/logo.f0f4e5c943afc7875feb.png'
const LOGO_ICON = '/favicon.png'

interface AnimatedLogoProps {
  expanded: boolean
}

/**
 * Animated Logo Component - switches between full logo and icon with anime.js
 */
export function AnimatedLogo({ expanded }: AnimatedLogoProps) {
  const logoRef = useRef<HTMLImageElement>(null)
  const iconRef = useRef<HTMLImageElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (expanded) {
      // Icon to Full Logo
      anime
        .timeline({ easing: 'easeOutExpo' })
        .add({
          targets: iconRef.current,
          opacity: [1, 0],
          scale: [1, 0.5],
          rotate: [0, -10],
          duration: 250,
        })
        .add(
          {
            targets: logoRef.current,
            opacity: [0, 1],
            translateX: [-40, 0],
            scale: [0.7, 1],
            duration: 450,
          },
          '-=150'
        )
    } else {
      // Full Logo to Icon
      anime
        .timeline({ easing: 'easeOutExpo' })
        .add({
          targets: logoRef.current,
          opacity: [1, 0],
          translateX: [0, 40],
          scale: [1, 0.7],
          duration: 250,
        })
        .add(
          {
            targets: iconRef.current,
            opacity: [0, 1],
            scale: [0.5, 1],
            rotate: [-10, 0],
            duration: 450,
          },
          '-=150'
        )
    }
  }, [expanded])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Full Logo (expanded) */}
      <Box
        component="img"
        ref={logoRef}
        src={LOGO_FULL}
        alt="VTGTOOL"
        sx={{
          position: 'absolute',
          height: 36,
          width: 'auto',
          maxWidth: 180,
          objectFit: 'contain',
          opacity: expanded ? 1 : 0,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Icon Only (collapsed) */}
      <Box
        component="img"
        ref={iconRef}
        src={LOGO_ICON}
        alt="V"
        sx={{
          position: 'absolute',
          height: 40,
          width: 40,
          objectFit: 'contain',
          opacity: expanded ? 0 : 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </Box>
  )
}
