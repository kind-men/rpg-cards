<script lang="ts">
  import { getContentText } from '$lib/card-content';
  import { renderText } from '$lib/card-render-util';

  import { SPLIT_REGEX } from '$lib/constants';
  import type { CardContent } from '$model/card';

  export let content: CardContent;

  $: [castingTime, range, components, duration] = getContentText(content).split(SPLIT_REGEX);
</script>

<div class="wrapper">
  <div class="block">
    <h2>Casting time</h2>
    <p>{@html renderText(castingTime)}</p>
  </div>
  <div class="block">
    <h2>Range</h2>
    <p>{@html renderText(range)}</p>
  </div>
  <div class="block">
    <h2>Components</h2>
    <p>{@html renderText(components)}</p>
  </div>
  <div class="block">
    <h2>Duration</h2>
    <p>{@html renderText(duration)}</p>
  </div>
</div>

<style lang="scss">
  .wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background-color: var(--card-color);
    grid-gap: 0.5mm;
    margin-top: -0.2em;
  }

  .block {
    background-color: white;
    padding: 0.15em 0 0;
    font-size: var(--card-text-size);


    p,
    h2 {
      text-align: center;
      margin: 0;
      font-size: 1em;
    }

    h2 {
      text-transform: uppercase;
      font-weight: normal;
      color: var(--card-color);
      font-family: 'Overpass', sans-serif;
    }
  }
</style>
