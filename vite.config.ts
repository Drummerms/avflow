
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(rootDir, 'src')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(srcDir, 'components'),
      '@state': path.resolve(srcDir, 'state'),
      '@utils': path.resolve(srcDir, 'utils'),
      '@types': path.resolve(srcDir, 'types.ts')
    }
  }
})
