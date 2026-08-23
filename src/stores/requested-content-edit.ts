import { writable } from 'svelte/store';

export const requestedContentEditId = writable<string | null>(null);
