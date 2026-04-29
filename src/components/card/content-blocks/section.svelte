<script lang="ts">
  import { getContentText } from '$lib/card-content';
  import { renderText } from '$lib/card-render-util';

  import { SPLIT_REGEX } from '$lib/constants';
  import type { CardContent } from '$model/card';

  export let content: CardContent;

  $: [title, rightTitle] = getContentText(content).split(SPLIT_REGEX);
  $: hasLeftTitle = Boolean(title?.trim());
  $: hasRightTitle = Boolean(rightTitle?.trim());
</script>

<h3
  class="section"
  class:section-center-only={hasLeftTitle && !hasRightTitle}
  class:section-right-only={!hasLeftTitle && hasRightTitle}
  class:section-split={hasLeftTitle && hasRightTitle}
>
  {#if hasLeftTitle}
    <div class="section-left">
      {@html renderText(title)}
    </div>
  {/if}
  {#if hasRightTitle}
    <div class="section-right">
      {@html renderText(rightTitle)}
    </div>
  {/if}
</h3>

<style lang="scss">
  .section {
    display: flex;
    align-items: center;

    background-color: var(--card-color);
    color: white;
    font-size: 0.6em;
    margin-bottom: 0.3em;
    margin-left: -5px;
    margin-right: -5px;
    padding: 0.3em 0.75em 0.1em;
  }

  .section-left,
  .section-right {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .section-center-only {
    justify-content: center;

    .section-left {
      justify-content: center;
    }
  }

  .section-right-only {
    justify-content: flex-end;

    .section-right {
      justify-content: flex-end;
    }
  }

  .section-split {
    justify-content: space-between;
  }
</style>
