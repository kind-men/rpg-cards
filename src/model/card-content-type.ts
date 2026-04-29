import type { ComponentType } from 'svelte';

export default interface CardContentTypeDescriptor {
  readonly name: string;
  readonly label?: string;
  readonly description: string;
  readonly params: readonly CardContentTypeParam[];
  readonly renderComponent: ComponentType;
  readonly editorComponent: ComponentType;
}

export interface CardContentTypeParam {
  readonly name: string;
  readonly type?: 'text' | 'number' | 'textarea';
  readonly description?: string;
  readonly optional?: boolean;
}
