<script lang="ts">
  import type { FlatCardContent } from '$model/card';

  export let content: FlatCardContent;

  $: height = Number.parseFloat(content.content) || undefined;
</script>

<div class="fill" class:flex={height === undefined} style="height: {height}mm" />

<style lang="scss">
  .fill {
    &.flex {
      flex: 1;
    }
  }
</style>
