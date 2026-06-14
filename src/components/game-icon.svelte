<script lang="ts">
  import { browser } from '$app/environment';
  import { getIconSvg } from '../lib/icons';
  import type { ColorResolvable } from '../model/color-resolvable';

  export let name: string | null | undefined;

  let svg = '';
  let loadToken = 0;

  const loadIcon = async (iconName: string | null | undefined) => {
    const token = ++loadToken;
    svg = '';

    if (!iconName) {
      return;
    }

    const nextSvg = await getIconSvg(iconName);

    if (token === loadToken) {
      svg = nextSvg ?? '';
    }
  };

  $: if (browser) {
    void loadIcon(name);
  }

  export let color: ColorResolvable = 'var(--color-surface-base)';
  export let size: string = '1em';
</script>

<div class="icon" style="--icon-size: {size}; --icon-color: {color}">
  {#if svg}
    {@html svg}
  {/if}
</div>

<style lang="scss">
  .icon {
    display: flex;
    justify-content: center;
    align-items: center;

    :global(svg) {
      width: var(--icon-size);
      height: var(--icon-size);
    }

    :global(path) {
      fill: var(--icon-color);
    }
  }
</style>
