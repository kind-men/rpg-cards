<script lang="ts">
  import type CardContentTypeDescriptor from '$model/card-content-type';
  import { Input } from '@sveltestrap/sveltestrap';

  export let splitContent: string[] = [];
  export let typeDescriptor: CardContentTypeDescriptor;
</script>

<div class="editor-content-labeled-fields">
  {#each typeDescriptor.params as param, index}
    <div class="editor-content-field-row">
      <span class="editor-content-field-label">{param.name}</span>
      <Input
        class="editor-content-input"
        type={param.type ?? 'text'}
        bind:value={splitContent[index]}
        placeholder={param.name}
      />
    </div>
  {/each}
</div>

