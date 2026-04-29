<script lang="ts">
  import { Icon, Input } from 'sveltestrap';

  export let splitContent: string[] = [];
</script>

<div class="editor-content-embedded-input">
  <span class="editor-content-input-icon">
    <Icon name="dot" />
  </span>
  <Input
    class="editor-content-input editor-content-input-with-icon"
    type="text"
    bind:value={splitContent[0]}
    placeholder="Bullet text"
  />
</div>
