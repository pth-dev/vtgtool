import { useCallback, useRef } from 'react'

import { DarkMode, LightMode } from '@mui/icons-material'
import { Box, IconButton } from '@mui/material'

import anime from 'animejs'

import { useThemeStore } from '@/shared/stores/themeStore'

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeStore()
  const rippleRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleToggle = useCallback(() => {
    const ripple = rippleRef.current
    const button = buttonRef.current
    if (!ripple || !button) {
      toggleMode()
      return
    }

    // Get click position
    const rect = button.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // Calculate the maximum distance to screen corners
    const maxX = Math.max(x, window.innerWidth - x)
    const maxY = Math.max(y, window.innerHeight - y)
    const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY) * 2

    // Set ripple position
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.style.backgroundColor = mode === 'light' ? '#121212' : '#ffffff'
    ripple.style.display = 'block'

    // Animate ripple
    anime({
      targets: ripple,
      scale: [0, 1],
      opacity: [1, 1],
      duration: 600,
      easing: 'easeOutQuad',
      begin: () => {
        ripple.style.width = `${maxRadius}px`
        ripple.style.height = `${maxRadius}px`
        ripple.style.marginLeft = `-${maxRadius / 2}px`
        ripple.style.marginTop = `-${maxRadius / 2}px`
      },
      complete: () => {
        toggleMode()
        // Fade out ripple
        anime({
          targets: ripple,
          opacity: [1, 0],
          duration: 300,
          easing: 'easeOutQuad',
          complete: () => {
            ripple.style.display = 'none'
            ripple.style.transform = 'scale(0)'
          },
        })
      },
    })
  }, [mode, toggleMode])

  return (
    <>
      <IconButton ref={buttonRef} onClick={handleToggle} size="small" color="inherit">
        {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
      </IconButton>
      <Box
        ref={rippleRef}
        sx={{
          position: 'fixed',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'none',
          transform: 'scale(0)',
        }}
      />
    </>
  )
}
