import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      createSvgIconsPlugin({
        iconDirs: [fileURLToPath(new URL('./src/assets/icons/svg', import.meta.url))],
        symbolId: 'icon-[name]'
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0',
      port: 8080,
      proxy: {
        [`${env.VITE_API_BASE}/admin`]: {
          target: 'http://localhost:19010/admin',
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp(`^${env.VITE_API_BASE}/admin`), '')
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})
