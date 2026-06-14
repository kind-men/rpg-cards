import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import remarkHeadingId from 'remark-heading-id';

const basePath = process.env.BASE_PATH || '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md', '.svelte.md', '.svx'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.svelte.md', '.md', '.svx'],
      rehypePlugins: [rehypeSlug],
      remarkPlugins: [remarkHeadingId]
    })
  ],
  kit: {
    adapter: adapter(),
    alias: {
      $components: 'src/components',
      $model: 'src/model'
    },
    paths: {
      base: basePath
    },
    serviceWorker: {
      files: (file) => {
        const normalizedFile = file.replace(/\\/g, '/');
        return !normalizedFile.startsWith('icons/') || normalizedFile === 'icons/icons.json';
      }
    }
  }
};

export default config;
