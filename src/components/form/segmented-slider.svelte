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
  $: segmentCount = Math.max(Math.round(safeRange / Math.max(step, 1)) + 1, 2);
  $: progressPercent = `${((normalizedValue - min) / safeRange) * 100}%`;

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
    style={`--slider-progress: ${progressPercent}; --slider-segment-count: ${segmentCount};`}
    on:input={handleInput}
    on:change={handleChange}
  />
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

  .segmented-slider-input {
    --segmented-slider-filled: var(--color-ink-900);
    --segmented-slider-empty: var(--color-surface-subtle);
    --segmented-slider-divider: var(--color-border-soft);
    --segmented-slider-thumb: var(--color-surface-base);
    --segmented-slider-thumb-shadow: rgb(15 23 42 / 0.18);
    width: 100%;
    height: 1.5rem;
    margin: 0;
    padding: 0.2rem;
    border: 1px solid var(--segmented-slider-divider);
    border-radius: 999px;
    background-color: var(--segmented-slider-empty);
    background-image:
      linear-gradient(
        90deg,
        var(--segmented-slider-filled) 0,
        var(--segmented-slider-filled) var(--slider-progress),
        var(--segmented-slider-empty) var(--slider-progress),
        var(--segmented-slider-empty) 100%
      ),
      repeating-linear-gradient(
        90deg,
        transparent 0,
        transparent calc((100% / var(--slider-segment-count)) - 2px),
        var(--segmented-slider-divider) calc((100% / var(--slider-segment-count)) - 2px),
        var(--segmented-slider-divider) calc(100% / var(--slider-segment-count))
      );
    background-clip: padding-box;
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.08);
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    flex: 1 1 auto;
  }

  .segmented-slider-input::-webkit-slider-runnable-track {
    height: 100%;
    background: transparent;
    border: 0;
  }

  .segmented-slider-input::-webkit-slider-thumb {
    width: 1rem;
    height: 1rem;
    margin-top: 0.05rem;
    border: 2px solid var(--segmented-slider-filled);
    border-radius: 999px;
    background:
      radial-gradient(circle at 50% 50%, var(--segmented-slider-filled) 0 0.18rem, transparent 0.18rem),
      var(--segmented-slider-thumb);
    box-shadow: 0 2px 8px var(--segmented-slider-thumb-shadow);
    appearance: none;
    -webkit-appearance: none;
  }

  .segmented-slider-input::-moz-range-track {
    height: 100%;
    background: transparent;
    border: 0;
  }

  .segmented-slider-input::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border: 2px solid var(--segmented-slider-filled);
    border-radius: 999px;
    background:
      radial-gradient(circle at 50% 50%, var(--segmented-slider-filled) 0 0.18rem, transparent 0.18rem),
      var(--segmented-slider-thumb);
    box-shadow: 0 2px 8px var(--segmented-slider-thumb-shadow);
  }
</style>
