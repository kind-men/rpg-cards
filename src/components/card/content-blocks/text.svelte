<script lang="ts">
  import { renderText } from '$lib/card-render-util';
  import type { FlatCardContent } from '$model/card';

  export let content: FlatCardContent;
</script>

<p class="text">{@html renderText(content.content, { markdown: { inline: false } })}</p>

<style lang="scss">
  .text {
    font-size: var(--card-text-size);
  }
</style>
