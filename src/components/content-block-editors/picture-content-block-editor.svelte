<script lang="ts">
  import type CardContentTypeDescriptor from '$model/card-content-type';
  import { Input } from 'sveltestrap';
  import ImageUploadInput from '../image-upload-input.svelte';

  export let splitContent: string[] = [];
  export let typeDescriptor: CardContentTypeDescriptor;
</script>

<ImageUploadInput
  src={splitContent[0]}
  alt="Picture content preview"
  emptyLabel="No image"
  on:change={(event) => (splitContent[0] = event.detail.src)}
>
  <Input type="text" bind:value={splitContent[0]} placeholder="URL" />
  <Input
    type="text"
    bind:value={splitContent[1]}
    placeholder="Size (for example 120px, 60%, auto)"
  />
</ImageUploadInput>
