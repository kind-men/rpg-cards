<script lang="ts">
  import { renderText } from '$lib/card-render-util';
  import { SPLIT_REGEX } from '$lib/constants';
  import type { FlatCardContent } from '$model/card';

  export let content: FlatCardContent;

  $: [leftText, rightText] = content.content.split(SPLIT_REGEX);
  $: hasLeftText = Boolean(leftText?.trim());
  $: hasRightText = Boolean(rightText?.trim());
</script>

<div
  class="footer"
  class:footer-left-only={hasLeftText && !hasRightText}
  class:footer-right-only={!hasLeftText && hasRightText}
  class:footer-split={hasLeftText && hasRightText}
>
  {#if hasLeftText}
    <div class="footer-left">
      {@html renderText(leftText)}
    </div>
  {/if}
  {#if hasRightText}
    <div class="footer-right">
      {@html renderText(rightText)}
    </div>
  {/if}
</div>

<style lang="scss">
  .footer {
    display: flex;
    align-items: flex-end;
    gap: 0.5em;
    min-height: 1.2em;
    padding: 0 0.5em;
    background: transparent;
    font-size: 0.7em;
    line-height: 1.1;
  }

  .footer-left,
  .footer-right {
    min-width: 0;
  }

  .footer-left-only {
    justify-content: flex-start;
  }

  .footer-right-only {
    justify-content: flex-end;
  }

  .footer-split {
    justify-content: space-between;
  }

  .footer-right {
    text-align: right;
  }
</style>
