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

    :global(table) {
      width: calc(100% - 1em);
      max-width: 100%;
      margin: 0 0.5em 0.25rem;
      border-collapse: collapse;
      font-size: 0.9em;
      line-height: 1.1;
    }

    :global(th),
    :global(td) {
      padding: 0.12em 0.35em;
      border: 1px solid color-mix(in srgb, var(--card-color) 45%, #ffffff);
      vertical-align: top;
    }

    :global(th) {
      background: color-mix(in srgb, var(--card-color) 14%, #ffffff);
      color: var(--card-color);
      font-weight: 700;
    }
  }
</style>
