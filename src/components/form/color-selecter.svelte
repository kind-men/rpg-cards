<script lang="ts">
  import { uuid4 } from '$lib/uuid';
  import { recentColors } from '../../stores';
  import { Icon, Popover, TabContent, TabPane, Tooltip } from 'sveltestrap';
  import colorSets from '../../../static/colors.json';

  let isOpen = false;
  export let value: string;
  export let id = `color-select-button-${uuid4()}`;

  $: recentsSet = {
    set: 'Recents',
    colors: $recentColors.map((v) => ({ name: v, color: v }))
  };

  const close = () => {
    isOpen = false;
  };

  const handleBodyClick = () => {
    if (isOpen) {
      close();
    }
  };

  const handleColorClick = (color: string) => {
    value = color;
    recentColors.add(color);
    close();
  };
</script>

<svelte:body on:click={handleBodyClick} />

<button
  {id}
  class="color-select-button"
  type="button"
  aria-label="Open color palette"
  on:click|preventDefault|stopPropagation
>
  <Icon name="palette-fill" />
</button>
<Popover class="popover" placement="bottom" target={id} bind:isOpen>
  <div
    class="wrapper"
    role="presentation"
    on:click|preventDefault|stopPropagation
    on:keydown|stopPropagation
  >
    <TabContent vertical pills>
      {#each [...colorSets, recentsSet] as set, setIndex}
        <TabPane tabId={setIndex} tab={set.set} active={setIndex === 0}>
          <div class="color-set">
            {#each set.colors as color, index (`${set.set}-${index}-${color.name}-${color.color}`)}
              <button
                class="color-item"
                id="color-item-{setIndex}-{index}"
                type="button"
                aria-label={`Select color ${color.name}`}
                on:click={() => handleColorClick(color.color)}
              >
                <div class="color rounded" style="--color: {color.color}"></div>
                <Tooltip target="color-item-{setIndex}-{index}">{color.name}</Tooltip>
              </button>
            {/each}
          </div>
        </TabPane>
      {/each}
    </TabContent>
  </div>
</Popover>

<style lang="scss">
  .color-select-button {
    --color-select-button-text: var(--color-ink-550);
    --color-select-button-text-hover: var(--color-ink-900);
    --color-select-button-hover-surface: var(--color-overlay-muted);
    --color-select-swatch-border: lightgray;
    width: 1.7rem;
    height: 1.7rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--color-select-button-text);
    transition: background-color 120ms ease, color 120ms ease, opacity 120ms ease;
    cursor: pointer;

    &:hover {
      background: var(--color-select-button-hover-surface);
      color: var(--color-select-button-text-hover);
    }
  }

  .wrapper {
    width: 300px;

    :global(.nav-item) {
      overflow-x: hidden;
      /* word-wrap: break-word; */
      white-space: nowrap;
    }
  }

  .color-set {
    display: flex;
    gap: 0.5em;
    flex-wrap: wrap;
    flex-direction: row;
  }

  .color-item {
    width: 2em;
    height: 2em;
    cursor: pointer;

    .color {
      background-color: var(--color);

      border: 1px solid var(--color-select-swatch-border);

      width: 2em;
      height: 2em;
    }
  }
</style>
