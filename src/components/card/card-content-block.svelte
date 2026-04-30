<script lang="ts">
  import { getContentPaddingRemValue } from '$lib/card-content';
  import { getContentTypeDescriptor, resolveContentBlockRenderProps } from '$lib/card-content-types';
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';
  import { hoveredContentId } from '../../stores';

  export let content: CardContent;
  export let card: Card;
  $: typeDescriptor = getContentTypeDescriptor(content.type);
  $: renderProps = resolveContentBlockRenderProps(content, card);
  $: isHighlighted = Boolean(content.id) && $hoveredContentId === content.id;
  $: paddingRem = getContentPaddingRemValue(content);
</script>

<div
  class:card-content-highlighted={isHighlighted}
  class="card-content-block"
  style={`--card-content-padding-y: ${paddingRem}rem;`}
>
  <svelte:component this={typeDescriptor.renderComponent} {...renderProps} />
</div>

<style lang="scss">
  .card-content-block {
    --card-content-highlight-surface: var(--color-border-soft);
    --card-content-highlight-border: var(--color-border-medium);
    padding-top: var(--card-content-padding-y, 0);
    padding-bottom: var(--card-content-padding-y, 0);
    border-radius: 0.2rem;
    transition: background-color 120ms ease, box-shadow 120ms ease;
  }

  .card-content-highlighted {
    background: var(--card-content-highlight-surface);
    box-shadow: 0 0 0 1px var(--card-content-highlight-border);
  }
</style>
