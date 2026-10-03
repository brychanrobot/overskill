import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port,
    strictPort: true,
    allowedHosts: true, // Allow Caddy reverse proxy on *.localhost (e.g. <project-name>.localhost)
  },
});

