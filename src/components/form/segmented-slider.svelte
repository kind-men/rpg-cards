<script lang="ts">
  import { Icon } from '@sveltestrap/sveltestrap';
  import { createEventDispatcher } from 'svelte';

  export let value = 0;
  export let min = 0;
  export let max = 7;
  export let step = 1;
  export let iconName = '';
  export let ariaLabel = 'Slider';
  export let title = '';
  export let id: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    input: { value: number };
    change: { value: number };
  }>();

  $: safeRange = Math.max(max - min, 1);
  $: normalizedValue = Math.min(max, Math.max(min, Number(value) || 0));
  $: segmentCount = Math.max(Math.round(safeRange / Math.max(step, 1)), 1);
  $: progressPercent = `${((normalizedValue - min) / safeRange) * 100}%`;
  $: filledSegmentCount = Math.max(
    0,
    Math.min(segmentCount, Math.round((normalizedValue - min) / Math.max(step, 1)))
  );

  const handleInput = (event: Event) => {
    value = Number((event.currentTarget as HTMLInputElement).value);
    dispatch('input', { value });
  };

  const handleChange = (event: Event) => {
    value = Number((event.currentTarget as HTMLInputElement).value);
    dispatch('change', { value });
  };
</script>

<div class="segmented-slider-row">
  {#if iconName}
    <span class="segmented-slider-icon" aria-hidden="true">
      <Icon name={iconName} />
    </span>
  {/if}

  <div class="segmented-slider-shell">
    <div
      class="segmented-slider-track"
      aria-hidden="true"
      style={`--slider-segment-count: ${segmentCount};`}
    >
      {#each Array.from({ length: segmentCount }, (_, index) => index) as index}
        <span
          class="segmented-slider-track-segment"
          class:segmented-slider-track-segment-filled={index < filledSegmentCount}
        ></span>
      {/each}
    </div>

    <input
      bind:value
      {id}
      class="segmented-slider-input"
      type="range"
      {min}
      {max}
      {step}
      {title}
      aria-label={ariaLabel}
      style={`--slider-progress: ${progressPercent};`}
      on:input={handleInput}
      on:change={handleChange}
    />
  </div>
</div>

<style lang="scss">
  .segmented-slider-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .segmented-slider-icon {
    width: 1.5rem;
    height: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-ink-575);
    flex: 0 0 auto;
  }

  .segmented-slider-shell {
    position: relative;
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    min-width: 0;
    height: 1.5rem;
  }

  .segmented-slider-track {
    --segmented-slider-accent: var(--color-brand-primary);
    --segmented-slider-filled: var(--segmented-slider-accent);
    --segmented-slider-empty: var(--color-surface-subtle);
    --segmented-slider-divider: var(--color-border-soft);
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(var(--slider-segment-count, 7), minmax(0, 1fr));
    gap: 0.2rem;
    padding: 0.2rem;
    pointer-events: none;
  }

  .segmented-slider-track-segment {
    border: 1px solid var(--segmented-slider-divider);
    border-radius: 999px;
    background: var(--segmented-slider-empty);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.04);
  }

  .segmented-slider-track-segment-filled {
    background: var(--segmented-slider-filled);
    border-color: var(--segmented-slider-filled);
  }

  .segmented-slider-input {
    --segmented-slider-accent: var(--color-brand-primary);
    --segmented-slider-filled: var(--segmented-slider-accent);
    --segmented-slider-thumb: var(--color-surface-base);
    --segmented-slider-thumb-shadow: rgb(15 23 42 / 0.18);
    width: 100%;
    height: 1.5rem;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }

  .segmented-slider-input::-webkit-slider-runnable-track {
    height: 100%;
    background: transparent;
    border: 0;
  }

  .segmented-slider-input::-webkit-slider-thumb {
    width: 0;
    height: 0;
    margin-top: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .segmented-slider-input::-moz-range-track {
    height: 100%;
    background: transparent;
    border: 0;
  }

  .segmented-slider-input::-moz-range-thumb {
    width: 0;
    height: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
</style>
