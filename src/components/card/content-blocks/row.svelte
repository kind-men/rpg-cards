<script lang="ts">
  import { getContentChildren } from '$lib/card-content';
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';
  import CardContentBlock from '../card-content.svelte';

  export let card: Card;
  export let content: CardContent;
  $: columns = getContentChildren(content);
</script>

<div class="card-row" style={`--card-row-columns: ${Math.max(columns?.length ?? 0, 1)};`}>
  {#each columns as column}
    <div class="card-row-column">
      {#each column as columnContent}
        <CardContentBlock content={columnContent} {card} />
      {/each}
    </div>
  {/each}
</div>

<style lang="scss">
  .card-row {
    display: grid;
    grid-template-columns: repeat(var(--card-row-columns), minmax(0, 1fr));
    gap: 0.45em;
    align-items: start;
    width: 100%;
  }

  .card-row-column {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2em;
  }
</style>
