import { writable } from 'svelte/store';

export const hoveredContentId = writable<string | null>(null);
