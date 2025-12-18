import { useEffect, useState } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = { mobile: 320, tablet: 768, desktop: 1280 }

export function useBreakpoint(): {
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
} {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const breakpoint: Breakpoint =
    width < BREAKPOINTS.tablet ? 'mobile' : width < BREAKPOINTS.desktop ? 'tablet' : 'desktop'

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  }
}
