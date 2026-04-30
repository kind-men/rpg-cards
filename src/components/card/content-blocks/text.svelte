<script lang="ts">
  import { getContentText } from '$lib/card-content';
  import { renderText } from '$lib/card-render-util';
  import type { CardContent } from '$model/card';

  export let content: CardContent;
</script>

<div class="text">{@html renderText(getContentText(content), { markdown: { inline: false } })}</div>

<style lang="scss">
  .text {
    font-size: var(--card-text-size);

    > :global(*) {
      margin-bottom: 0.25rem !important;

      &:last-child {
        margin-bottom: 0 !important;
      }
    }
  }
</style>
