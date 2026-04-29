<script lang="ts">
  import { getContentText } from '$lib/card-content';
  import { renderText } from '$lib/card-render-util';
  import type Card from '$model/card';
  import type { CardContent } from '$model/card';

  export let card: Card;
  export let content: CardContent;
</script>

<ul class="bullet">
  <li>
    {@html renderText(getContentText(content))}
  </li>
</ul>

<style lang="scss">
  .bullet {
    padding: 0;
    margin: 0 0.5em;
    list-style: inside;
    font-size: var(--card-text-size);
  }
</style>
