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

declare module '@toast-ui/editor';
declare module 'simple-svelte-autocomplete';

declare module 'sveltestrap' {
    import type { SvelteComponentTyped } from 'svelte';

    export class Accordion extends SvelteComponentTyped<any> {}
    export class AccordionItem extends SvelteComponentTyped<any> {}
    export class Alert extends SvelteComponentTyped<any> {}
    export class Button extends SvelteComponentTyped<any> {}
    export class ButtonGroup extends SvelteComponentTyped<any> {}
    export class Form extends SvelteComponentTyped<any> {}
    export class Icon extends SvelteComponentTyped<any> {}
    export class Input extends SvelteComponentTyped<any> {}
    export class InputGroup extends SvelteComponentTyped<any> {}
    export class InputGroupText extends SvelteComponentTyped<any> {}
    export class Label extends SvelteComponentTyped<any> {}
    export class Modal extends SvelteComponentTyped<any> {}
    export class ModalBody extends SvelteComponentTyped<any> {}
    export class ModalFooter extends SvelteComponentTyped<any> {}
    export class ModalHeader extends SvelteComponentTyped<any> {}
    export class Popover extends SvelteComponentTyped<any> {}
    export class Styles extends SvelteComponentTyped<any> {}
    export class TabContent extends SvelteComponentTyped<any> {}
    export class TabPane extends SvelteComponentTyped<any> {}
    export class Toast extends SvelteComponentTyped<any> {}
    export class ToastHeader extends SvelteComponentTyped<any> {}
    export class Tooltip extends SvelteComponentTyped<any> {}
}

declare module 'sveltestrap/src/Button' {
    export type ButtonColor = string;
}
