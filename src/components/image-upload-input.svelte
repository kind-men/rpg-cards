<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Input } from 'sveltestrap';

  export let src = '';
  export let alt = 'Uploaded image preview';
  export let emptyLabel = 'Empty';
  export let accept = 'image/*';

  const dispatch = createEventDispatcher<{ change: { src: string } }>();

  const handleFileChange = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    dispatch('change', { src: dataUri });
    input.value = '';
  };
</script>

<div class="image-upload-row">
  <div class="image-upload-preview">
    {#if src}
      <img {src} {alt} />
    {:else}
      <span>{emptyLabel}</span>
    {/if}
  </div>
  <div class="image-upload-controls">
    <Input type="file" {accept} on:change={handleFileChange} />
    <slot />
  </div>
</div>

<style lang="scss">
  .image-upload-row {
    --image-upload-border: var(--color-border-soft);
    --image-upload-surface: var(--color-surface-muted);
    --image-upload-preview-surface: var(--color-surface-base);
    --image-upload-preview-placeholder: var(--color-ink-300);
    display: grid;
    grid-template-columns: 4.25rem minmax(0, 1fr);
    align-items: start;
    gap: 0.5rem;
    padding: 0.35rem;
    border: 1px solid var(--image-upload-border);
    border-radius: 0.25rem;
    background: var(--image-upload-surface);
  }

  .image-upload-preview {
    width: 4.25rem;
    height: 4.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid var(--image-upload-border);
    border-radius: 0.1875rem;
    background: var(--image-upload-preview-surface);
    color: var(--image-upload-preview-placeholder);
  }

  .image-upload-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .image-upload-controls {
    min-width: 0;
    display: grid;
    gap: 0.25rem;
  }
</style>
