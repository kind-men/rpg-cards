<script lang="ts">
  import type Card from '$model/card';
  import type { CardContent as CardContentModel } from '$model/card';
  import CardContentBlock from './card-content-block.svelte';

  export let contents: CardContentModel[] = [];
  export let card: Card;
</script>

{#each contents as content}
  <CardContentBlock {content} {card} />
{/each}
