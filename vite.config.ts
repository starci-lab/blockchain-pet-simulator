import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'library') {
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'PhaserDogGame',
          formats: ['es', 'cjs'],
          fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'phaser'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              phaser: 'Phaser'
            }
          }
        }
      }
    }
  }

  return {
    plugins: [react()]
  }
})
