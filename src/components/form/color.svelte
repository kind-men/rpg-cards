<script lang="ts">
  import { Input, InputGroup, InputGroupText } from 'sveltestrap';
  import { recentColors } from '../../stores';
  import ColorSelecter from './color-selecter.svelte';

  export let value: string;
  export let idPrefix = 'color';
  export let name = 'color';
  export let placeholder = 'Color';

  const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

  const toHex = (num: number) => clamp(Math.round(num), 0, 255).toString(16).padStart(2, '0');

  const parseHexColor = (input: string) => {
    const hex = input.replace('#', '').trim();

    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }

    if (hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255
      };
    }

    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    }

    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255
      };
    }

    return null;
  };

  const parseRgbColor = (input: string) => {
    const match = input.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }

    const parts = match[1].split(',').map((part) => part.trim());
    if (parts.length < 3) {
      return null;
    }

    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = parts[3] !== undefined ? Number(parts[3]) : 1;

    if ([r, g, b, a].some((part) => Number.isNaN(part))) {
      return null;
    }

    return { r, g, b, a };
  };

  const parseColor = (input: string) => {
    if (!input) {
      return { r: 255, g: 255, b: 255, a: 1 };
    }

    if (input.trim().startsWith('#')) {
      return parseHexColor(input) ?? { r: 255, g: 255, b: 255, a: 1 };
    }

    if (input.trim().startsWith('rgb')) {
      return parseRgbColor(input) ?? { r: 255, g: 255, b: 255, a: 1 };
    }

    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const formatColor = (r: number, g: number, b: number, a: number) => {
    const red = clamp(r, 0, 255);
    const green = clamp(g, 0, 255);
    const blue = clamp(b, 0, 255);
    const alpha = clamp(a, 0, 1);

    if (alpha >= 0.999) {
      return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
    }

    return `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${alpha.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')})`;
  };

  let colorHex = '#ffffff';
  let alphaPercent = 100;
  let isSyncingControls = false;
  let lastCommittedAlphaPercent = alphaPercent;

  const syncControlsFromValue = () => {
    isSyncingControls = true;
    const { r, g, b, a } = parseColor(value);
    colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    alphaPercent = Math.round(clamp(a, 0, 1) * 100);
    lastCommittedAlphaPercent = alphaPercent;
    isSyncingControls = false;
  };

  $: value, syncControlsFromValue();
  $: if (!isSyncingControls && alphaPercent !== lastCommittedAlphaPercent) {
    commitColor();
    recentColors.add(value);
    lastCommittedAlphaPercent = alphaPercent;
  }

  const commitColor = () => {
    const { r, g, b } = parseHexColor(colorHex) ?? { r: 255, g: 255, b: 255, a: 1 };
    value = formatColor(r, g, b, alphaPercent / 100);
  };

  const handleHexChange = () => {
    commitColor();
    recentColors.add(value);
  };

  const handleColorChange = () => {
    syncControlsFromValue();
    recentColors.add(value);
  };
</script>

<div class="color-input-layout">
  <div class="color-main-row">
    <InputGroup class="color-text-group">
      <InputGroupText>
        <input
          class="color-input rounded"
          type="color"
          name={name}
          id={`${idPrefix}-box`}
          bind:value={colorHex}
          on:input={handleHexChange}
          on:change={handleHexChange}
        />
      </InputGroupText>
      <Input
        type="text"
        {name}
        id={`${idPrefix}-text`}
        bind:value
        {placeholder}
        on:change={handleColorChange}
      />
    </InputGroup>

    <ColorSelecter id={`${idPrefix}-select-button`} bind:value />
  </div>

  <div class="alpha-row">
    <Input
      class="alpha-input"
      type="range"
      min="0"
      max="100"
      step="1"
      aria-label="Opacity"
      style={`--alpha-color: ${colorHex};`}
      bind:value={alphaPercent}
    />
    <div class="alpha-value">{alphaPercent}%</div>
  </div>
</div>

<style lang="scss">
  .color-input-layout {
    --color-input-border: var(--color-border-bootstrap);
    --color-input-surface: var(--color-surface-base);
    --color-input-surface-muted: var(--color-surface-subtle);
    --color-input-text: var(--color-ink-900);
    --color-input-checker: var(--color-border-soft);
    --color-input-thumb-border: var(--color-surface-base);
    --color-input-thumb-shadow: var(--color-border-intense);
    display: grid;
    gap: 0.35rem;
  }

  .color-main-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.35rem;
    align-items: center;
  }

  .color-text-group {
    min-width: 0;
  }

  .alpha-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.35rem;
    align-items: center;
  }

  .color-input {
    width: 1.5rem;
    height: 1.5rem;
    cursor: pointer;
    overflow: hidden;
  }

  :global(.alpha-input.form-range) {
    width: 100%;
    max-width: none;
    padding: 0.2rem;
    border-radius: var(--editor-form-control-radius);
    border: 1px solid var(--bs-border-color, var(--color-input-border));
    background-color: var(--color-input-surface);
    background-image:
      linear-gradient(45deg, var(--color-input-checker) 25%, transparent 25%),
      linear-gradient(-45deg, var(--color-input-checker) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--color-input-checker) 75%),
      linear-gradient(-45deg, transparent 75%, var(--color-input-checker) 75%),
      linear-gradient(90deg, var(--color-white-0) 0%, var(--alpha-color) 100%);
    background-position:
      0 0,
      0 0.4rem,
      0.4rem -0.4rem,
      -0.4rem 0,
      0 0;
    background-size:
      0.8rem 0.8rem,
      0.8rem 0.8rem,
      0.8rem 0.8rem,
      0.8rem 0.8rem,
      100% 100%;
    background-repeat: repeat, repeat, repeat, repeat, no-repeat;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
  }

  .alpha-value {
    min-width: 3.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--editor-form-control-padding-y) var(--editor-form-control-padding-x);
    border: 1px solid var(--bs-border-color, var(--color-input-border));
    border-radius: var(--editor-form-control-radius);
    background: var(--color-input-surface-muted);
    color: var(--color-input-text);
  }

  :global(.alpha-input.form-range::-webkit-slider-runnable-track) {
    height: 100%;
    background: transparent;
    border: 0;
  }

  :global(.alpha-input.form-range::-webkit-slider-thumb) {
    width: 0.7rem;
    height: 0.7rem;
    margin-top: .15rem;
    border: 2px solid var(--color-input-thumb-border);
    border-radius: 999px;
    background: transparent;
    box-shadow: 0 1px 3px var(--color-input-thumb-shadow);
    appearance: none;
    -webkit-appearance: none;
  }

  :global(.alpha-input.form-range::-moz-range-track) {
    height: 100%;
    background: transparent;
    border: 0;
  }

  :global(.alpha-input.form-range::-moz-range-thumb) {
    width: 0.9rem;
    height: 0.9rem;
    border: 1px solid var(--color-input-thumb-shadow);
    border-radius: 999px;
    background: var(--color-input-surface);
    box-shadow: 0 1px 3px var(--color-input-thumb-shadow);
  }
</style>
