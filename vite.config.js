import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Optimización: Incluir displayName para mejor debugging en producción sin costo significativo
      babel: {
        plugins: [],
      }
    })
  ],
  server: {
    headers: {
      // Content Security Policy estricta para prevenir XSS
      // Nota: 'unsafe-inline' y 'unsafe-eval' se mantienen por compatibilidad con Vite HMR en desarrollo
      // En producción, usar nonces o hashes para eliminar unsafe-inline
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'sha256-<nonce-placeholder>' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co blob:; connect-src 'self' https://*.supabase.co https://*.netlify.app;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Desactivar source maps en producción para no exponer lógica
    minify: 'terser',
    target: 'esnext', // Usar características modernas de JS para mejor rendimiento
    cssCodeSplit: true, // Separar CSS para code splitting
    assetsInlineLimit: 4096, // Inline assets menores a 4KB
    rollupOptions: {
      output: {
        manualChunks: {
          // Code splitting estratégico
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          zod: ['zod']
        },
        // Nomenclatura optimizada para caching
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    },
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.logs en producción
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.log', 'console.warn'],
        passes: 2 // Múltiples pasadas para mejor optimización
      },
      format: {
        comments: false // Eliminar comentarios
      }
    },
    // Límites de tamaño para alertas
    chunkSizeWarningLimit: 500
  },
  optimizeDeps: {
    // Pre-bundling de dependencias para mejor rendimiento en dev
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: []
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true
  }
})