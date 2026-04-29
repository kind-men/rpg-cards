import type { SvelteComponent } from 'svelte';

export default interface CardContentTypeDescriptor {
  readonly name: string;
  readonly label?: string;
  readonly description: string;
  readonly params: readonly CardContentTypeParam[];
  readonly renderComponent: typeof SvelteComponent;
  readonly editorComponent: typeof SvelteComponent;
}

export interface CardContentTypeParam {
  readonly name: string;
  readonly type?: 'text' | 'number' | 'textarea';
  readonly description?: string;
  readonly optional?: boolean;
}
