<script lang="ts">
  import { Input } from 'sveltestrap';

  export let splitContent: string[] = [];
</script>

<div class="editor-content-field-row">
  <span class="editor-content-field-label">Height</span>
  <Input
    class="editor-content-input small-input"
    type="number"
    bind:value={splitContent[0]}
    placeholder="Height in mm"
  />
</div>
