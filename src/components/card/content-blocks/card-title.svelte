<script lang="ts">
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';

  export let content: CardContent;
  export let card: Card;
  $: void content;
</script>

{#if card?.title}
  <div class="title-wrapper">
    <h1>{card.title}</h1>
  </div>
{/if}

<style lang="scss">
  h1 {
    margin: 0;
    font-size: var(--card-title-size);
    text-transform: uppercase;
    font-weight: 800;
    font-family: 'Overpass', sans-serif;
    letter-spacing: -0.025em;
    padding: 0.25rem 0;
  }

  .title-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 0;
  }
</style>
