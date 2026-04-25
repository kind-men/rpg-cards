<script lang="ts">
  import { getContentTypeDescriptor } from '$lib/card-content-types';
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';
  import { hoveredContentId } from '../../stores';

  export let content: CardContent;
  export let card: Card;
  $: typeDescriptor = getContentTypeDescriptor(content.type);
  $: isHighlighted = Boolean(content.id) && $hoveredContentId === content.id;
</script>

<div class:card-content-highlighted={isHighlighted} class="card-content-block">
  <svelte:component this={typeDescriptor.renderComponent} {content} {card} />
</div>

<style lang="scss">
  .card-content-block {
    border-radius: 0.2rem;
    transition: background-color 120ms ease, box-shadow 120ms ease;
  }

  .card-content-highlighted {
    background: rgba(18, 38, 63, 0.08);
    box-shadow: 0 0 0 1px rgba(18, 38, 63, 0.12);
  }
</style>
