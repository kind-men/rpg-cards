<script lang="ts">
  import { Input, InputGroup, InputGroupText } from 'sveltestrap';
  import { recentColors } from '../stores';
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

  const syncControlsFromValue = () => {
    const { r, g, b, a } = parseColor(value);
    colorHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    alphaPercent = Math.round(clamp(a, 0, 1) * 100);
  };

  $: value, syncControlsFromValue();

  const commitColor = () => {
    const { r, g, b } = parseHexColor(colorHex) ?? { r: 255, g: 255, b: 255, a: 1 };
    value = formatColor(r, g, b, alphaPercent / 100);
  };

  const handleHexChange = () => {
    commitColor();
    recentColors.add(value);
  };

  const handleAlphaChange = () => {
    commitColor();
    recentColors.add(value);
  };

  const handleColorChange = () => {
    syncControlsFromValue();
    recentColors.add(value);
  };
</script>

<InputGroup>
  <InputGroupText>
    <input
      class="color-input rounded"
      type="color"
      alpha
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
  <Input
    class="alpha-input"
    type="range"
    min="0"
    max="100"
    step="1"
    aria-label="Opacity"
    bind:value={alphaPercent}
    on:input={handleAlphaChange}
    on:change={handleAlphaChange}
  />
  <InputGroupText class="alpha-value">{alphaPercent}%</InputGroupText>
  <InputGroupText>
    <ColorSelecter bind:value />
  </InputGroupText>
</InputGroup>

<style lang="scss">
  .color-input {
    width: 1.5rem;
    height: 1.5rem;
    cursor: pointer;
    overflow: hidden;
  }

  :global(.alpha-input.form-control) {
    max-width: 5.25rem;
    padding-left: 0.2rem;
    padding-right: 0.2rem;
  }

  .alpha-value {
    min-width: 3.25rem;
    justify-content: center;
  }
</style>
