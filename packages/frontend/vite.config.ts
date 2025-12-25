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
        manualChunks: {
          // Core dependencies
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['@tanstack/react-router', '@tanstack/react-query'],
          'vendor-utils': ['zustand', 'zod', 'react-hook-form', '@hookform/resolvers'],

          // UI libraries (split for better caching)
          'vendor-mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'vendor-mui-icons': ['@mui/icons-material'],

          // Heavy chart libraries (lazy loaded, separate chunks)
          'vendor-apexcharts': ['apexcharts', 'react-apexcharts'],
          'vendor-echarts': ['echarts', 'echarts-for-react'],

          // Other heavy dependencies
          'vendor-table': ['@tanstack/react-table'],
          'vendor-grid': ['react-grid-layout'],
          'vendor-xlsx': ['xlsx'],
        },
      },
    },
    // Increase limit but warn on very large chunks
    chunkSizeWarningLimit: 500,
    // Use esbuild minification (faster, less memory intensive than terser)
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
