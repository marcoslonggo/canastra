import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Server configuration to match react-scripts behavior
  server: {
    port: 3004,
    host: true, // Allow external connections (like react-scripts HOST=0.0.0.0)
    open: false, // Don't auto-open browser
  },

  // Build configuration
  build: {
    outDir: 'build', // Match react-scripts output directory
    sourcemap: true,
    // Generate legacy chunks for better browser compatibility
    target: ['es2015', 'chrome79', 'firefox67', 'safari13.1'],
  },

  // Resolve configuration for path aliases and extensions
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.js',
  },

  // Environment variables - Vite uses VITE_ prefix instead of REACT_APP_
  define: {
    // Make sure environment variables work
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },

  // Preview configuration (for production build testing)
  preview: {
    port: 3004,
    host: true,
  },
});