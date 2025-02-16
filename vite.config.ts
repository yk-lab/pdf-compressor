import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import webpackStatsPlugin from 'rollup-plugin-webpack-stats';
import { defaultExclude } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    viteStaticCopy({
      targets: [
        {
          src: './node_modules/pdfjs-dist/cmaps',
          dest: 'assets/'
        }
      ]
    }),
    // Output webpack-stats.json file
    webpackStatsPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [...defaultExclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    setupFiles: [
      'vitest.setup.ts',
    ],
    reporters: [
      'default',
      'junit',
      ['vitest-sonar-reporter', { outputFile: './coverage/sonar-report.xml' }],
    ],
    coverage: {
      reporter: ['text', 'html', 'clover', 'lcov', 'json'],
      include: ['src/**'],
    },
    outputFile: {
      junit: './coverage/junit.xml',
    },
  }, optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    }
  }
})
