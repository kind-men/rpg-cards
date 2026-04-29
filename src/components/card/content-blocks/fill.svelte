<script lang="ts">
  import { getContentText } from '$lib/card-content';
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';

  export let card: Card;
  export let content: CardContent;

  $: height = Number.parseFloat(getContentText(content)) || undefined;
</script>

<div class="fill" class:flex={height === undefined} style="height: {height}mm" />

<style lang="scss">
  .fill {
    &.flex {
      flex: 1;
    }
  }
</style>
