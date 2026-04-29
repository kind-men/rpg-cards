<script lang="ts">
  import { Input } from 'sveltestrap';

  export let splitContent: string[] = [];
</script>

<div class="editor-content-grid-fields-compact">
  <div class="editor-content-field-row">
    <span class="editor-content-field-label">Amount</span>
    <Input
      class="editor-content-input"
      type="number"
      bind:value={splitContent[0]}
      placeholder="Amount"
    />
  </div>
  <div class="editor-content-field-row">
    <span class="editor-content-field-label">Size</span>
    <Input class="editor-content-input" type="text" bind:value={splitContent[1]} placeholder="Size" />
  </div>
</div>
