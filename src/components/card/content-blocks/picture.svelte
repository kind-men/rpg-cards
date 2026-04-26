<script lang="ts">
  import { SPLIT_REGEX } from '$lib/constants';
  import type { CardContent } from '$model/card';

  export let content: CardContent;

  $: [src, size] = content.content.split(SPLIT_REGEX);
</script>

<!-- svelte-ignore a11y-img-redundant-alt -->
<img class="picture" {src} style={size ? `height: ${size};` : ''} alt="RPG Card picture" />

<style lang="scss">
  .picture {
    width: 100%;
    max-height: 100%;
    object-fit: scale-down;
  }
</style>
