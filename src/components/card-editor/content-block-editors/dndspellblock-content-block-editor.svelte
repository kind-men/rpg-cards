<script lang="ts">
  import type CardContentTypeDescriptor from '$model/card-content-type';
  import { Input } from '@sveltestrap/sveltestrap';

  export let splitContent: string[] = [];
  export let typeDescriptor: CardContentTypeDescriptor;
</script>

<div class="editor-content-labeled-fields">
  {#each typeDescriptor.params.slice(0, 4) as param, index}
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
  <div class="editor-content-field-row">
    <span class="editor-content-field-label">Concentration</span>
    <label class="editor-content-checkbox-label">
      <Input
        class="editor-content-checkbox"
        type="checkbox"
        checked={splitContent[4] === 'true'}
        on:change={(event) =>
          (splitContent[4] = (event.currentTarget as HTMLInputElement).checked ? 'true' : 'false')}
      />
      Requires concentration
    </label>
  </div>
</div>

<style lang="scss">
  .editor-content-checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--color-ink-675);
    font-size: 0.82rem;
  }

  :global(.editor-content-checkbox.form-check-input) {
    margin: 0;
  }
</style>

