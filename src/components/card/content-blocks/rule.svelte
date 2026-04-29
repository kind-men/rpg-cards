<script lang="ts">
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';

  export let content: CardContent;
  export let card: Card;
  $: void content;
  $: void card;
</script>

<div class="rule" />

<style>
  .rule {
    border-bottom: 2px solid var(--card-color);
    margin-bottom: 0.2em;
    margin-left: -2px;
    margin-right: -2px;
  }
</style>
