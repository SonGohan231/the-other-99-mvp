import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

const gitCommit = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() }
  catch { return 'unknown' }
})()

const buildDate = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

const deploySource = (() => {
  const ref = process.env.GITHUB_REF_NAME
  const vercel = process.env.VERCEL_GIT_COMMIT_REF
  if (ref) return ref
  if (vercel) return vercel
  return 'local'
})()

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
    __BUILD_DATE__: JSON.stringify(buildDate),
    __DEPLOY_SOURCE__: JSON.stringify(deploySource),
  },
})
