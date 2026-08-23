<script lang="ts">
  import { getContentText } from '$lib/card-content';
  import { renderText } from '$lib/card-render-util';

  import { SPLIT_REGEX } from '$lib/constants';
  import type { CardContent } from '$model/card';

  export let content: CardContent;

  $: [castingTime, range, components, duration, concentration] = getContentText(content).split(SPLIT_REGEX);
  $: requiresConcentration = concentration === 'true';
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
    <p class:duration-with-concentration={requiresConcentration}>
      {#if requiresConcentration}
        <span class="concentration-icon" aria-label="Requires concentration"><span>C</span></span>
      {/if}
      <span>{@html renderText(duration)}</span>
    </p>
  </div>
</div>

<style lang="scss">
  .wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background-color: var(--card-color);
    grid-gap: 0.5mm;
  }

  .block {
    background-color: white;
    padding: 0.25em 0 0.15em;
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

    .duration-with-concentration {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.28em;
      line-height: 1;
    }

    .concentration-icon {
      width: 1em;
      height: 1em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      background: #262626;
      color: #ffffff;
      font-family: Arial, sans-serif;
      font-size: 0.9em;
      font-weight: 700;
      line-height: 1;
      transform: rotate(45deg);
    }

    .concentration-icon > span {
      font-size: 0.55em;
      transform: rotate(-45deg);
    }
  }
</style>
