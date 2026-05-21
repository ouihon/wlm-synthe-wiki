import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const isUserPage = repoName?.endsWith('.github.io');
  const base = command === 'serve' || !repoName || isUserPage ? '/' : `/${repoName}/`;

  return {
    plugins: [react()],
    base,
  };
});
