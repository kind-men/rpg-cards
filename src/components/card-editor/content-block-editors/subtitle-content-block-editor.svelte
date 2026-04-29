<script lang="ts">
  import { Icon, Input } from 'sveltestrap';

  export let splitContent: string[] = [];
</script>

<div class="editor-content-labeled-fields">
  <div class="editor-content-embedded-input">
    <span class="editor-content-input-icon">
      <Icon name={splitContent[1]?.trim() ? 'justify-left' : 'justify'} />
    </span>
    <Input
      class="editor-content-input editor-content-input-with-icon"
      type="text"
      bind:value={splitContent[0]}
      placeholder="Subtitle"
    />
  </div>
  <div class="editor-content-embedded-input">
    <span class="editor-content-input-icon">
      <Icon name="justify-right" />
    </span>
    <Input
      class="editor-content-input editor-content-input-with-icon"
      type="text"
      bind:value={splitContent[1]}
      placeholder="Right-aligned"
    />
  </div>
</div>
