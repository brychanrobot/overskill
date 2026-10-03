import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    // Portless automatically assigns an ephemeral port and injects --port / PORT
    strictPort: true,
    allowedHosts: true, // Allow Portless proxy on *.localhost (e.g. <project-name>.localhost)
  },
  preview: {
    strictPort: true,
    allowedHosts: true,
  },
});
