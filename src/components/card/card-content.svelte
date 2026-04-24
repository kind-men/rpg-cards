<script lang="ts">
  import { getContentTypeDescriptor } from '$lib/card-content-types';
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';

  export let content: CardContent;
  export let card: Card;
  $: typeDescriptor = getContentTypeDescriptor(content.type);
</script>

<svelte:component this={typeDescriptor.renderComponent} {content} {card} />
