import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
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
      $components: path.resolve('src/components'),
      $model: path.resolve('src/model')
    },
    paths: {
      base: basePath
    }
  }
};

export default config;
