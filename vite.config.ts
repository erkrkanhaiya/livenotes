import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isWeb = mode === 'web'
  
  // Base configuration
  const config = {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    define: {
      global: 'globalThis',
      __IS_WEB__: JSON.stringify(isWeb),
      __IS_EXTENSION__: JSON.stringify(!isWeb),
    },
    server: {
      port: isWeb ? 5174 : 5173,
    },
    preview: {
      port: isWeb ? 4173 : 4172,
    },
  }

  if (isWeb) {
    // Web build configuration (Mobile PWA)
    return {
      ...config,
      build: {
        outDir: 'dist-web',
        rollupOptions: {
          input: resolve(__dirname, 'index.html'),
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
        // Copy public assets including manifest and service worker
        copyPublicDir: true,
      },
      publicDir: 'public',
    }
  } else {
    // Extension build configuration
    return {
      ...config,
      build: {
        outDir: 'dist',
        rollupOptions: {
          input: {
            popup: resolve(__dirname, 'index.html'),
            background: resolve(__dirname, 'src/background.ts'),
          },
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            assetFileNames: '[name].[ext]',
          },
        },
      },
    }
  }
})
