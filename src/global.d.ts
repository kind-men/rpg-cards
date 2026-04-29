/// <reference types="@sveltejs/kit" />

declare type DndEvent = import("svelte-dnd-action").DndEvent;
declare namespace svelte.JSX {
    interface HTMLAttributes<T> {
        onconsider?: (event: CustomEvent<DndEvent> & {target: EventTarget & T}) => void;
        onfinalize?: (event: CustomEvent<DndEvent> & {target: EventTarget & T}) => void;
    }
}

declare module '*.svx' {
    import type { SvelteComponentTyped } from 'svelte';

    export default class SvxComponent extends SvelteComponentTyped<Record<string, never>> {}
}
