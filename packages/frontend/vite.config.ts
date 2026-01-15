import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React - always needed
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          // Router & Query - needed for navigation
          if (id.includes('@tanstack/react-router') || id.includes('@tanstack/react-query')) {
            return 'vendor-router'
          }
          // Form & State utilities
          if (id.includes('zustand') || id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'vendor-utils'
          }
          // MUI Core - UI framework
          if (id.includes('@mui/material') || id.includes('@emotion')) {
            return 'vendor-mui-core'
          }
          // MUI Icons - separate for tree-shaking
          if (id.includes('@mui/icons-material')) {
            return 'vendor-mui-icons'
          }
          // ApexCharts - lazy loaded with dashboard
          if (id.includes('apexcharts') || id.includes('react-apexcharts')) {
            return 'vendor-apexcharts'
          }
          // ECharts - modular import, lazy loaded
          if (id.includes('echarts')) {
            return 'vendor-echarts'
          }
          // Table - lazy loaded with data pages
          if (id.includes('@tanstack/react-table')) {
            return 'vendor-table'
          }
          // Grid layout - lazy loaded with dashboard
          if (id.includes('react-grid-layout')) {
            return 'vendor-grid'
          }
          // XLSX - dynamic import only when exporting
          if (id.includes('xlsx')) {
            return 'vendor-xlsx'
          }
        },
      },
    },
    // Warn on chunks > 1000KB (relaxed threshold for known heavy libs)
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Target modern browsers for smaller output
    target: 'es2020',
  },
  // Optimize deps for faster dev startup
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
    exclude: ['xlsx'], // Don't pre-bundle xlsx - it's dynamically imported
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    headers: {
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
