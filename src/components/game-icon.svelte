<script lang="ts">
  import { getIcon } from '../lib/icons';
  import type { Icon as IconModel } from '../lib/icons';
  import type { ColorResolvable } from '../model/color-resolvable';

  export let name: string | null | undefined;

  let icon: IconModel | undefined;
  $: icon = name ? getIcon(name) : undefined;

  export let color: ColorResolvable = 'var(--color-surface-base)';
  export let size: string = '1em';
</script>

<div class="icon" style="--icon-size: {size}; --icon-color: {color}">
  {#if icon}
    <!-- <img src="/icons/{path}" alt="icon" /> -->
    <!-- <span style="--icon-path: {path};" /> -->
    {@html icon.svg}
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
