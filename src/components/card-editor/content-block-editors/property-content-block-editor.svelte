<script lang="ts">
  import { Input } from '@sveltestrap/sveltestrap';

  export let splitContent: string[] = [];
</script>

<div class="editor-content-labeled-fields">
  <div class="editor-content-field-row">
    <span class="editor-content-field-label">Name</span>
    <Input class="editor-content-input" type="text" bind:value={splitContent[0]} placeholder="Name" />
  </div>
  <div class="editor-content-field-row">
    <span class="editor-content-field-label">Description</span>
    <Input
      class="editor-content-input"
      type="text"
      bind:value={splitContent[1]}
      placeholder="Description"
    />
  </div>
</div>

