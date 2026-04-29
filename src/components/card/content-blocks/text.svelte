<script lang="ts">
  import { getContentText } from '$lib/card-content';
  import { renderText } from '$lib/card-render-util';
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';

  export let card: Card;
  export let content: CardContent;
</script>

<p class="text">{@html renderText(getContentText(content), { markdown: { inline: false } })}</p>

<style lang="scss">
  .text {
    font-size: var(--card-text-size);
  }
</style>
