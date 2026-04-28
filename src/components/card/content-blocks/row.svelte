<script lang="ts">
  import type Card from '$model/card';
  import type { RowCardContent } from '$model/card';
  import CardContent from '../card-content.svelte';

  export let card: Card;
  export let content: RowCardContent;
</script>

<div class="card-row" style={`--card-row-columns: ${Math.max(content.columns?.length ?? 0, 1)};`}>
  {#each content.columns as column}
    <div class="card-row-column">
      {#each column as columnContent}
        <CardContent content={columnContent} {card} />
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
