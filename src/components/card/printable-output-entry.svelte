<script lang="ts">
  import CardBack from './card-back.svelte';
  import CardComponent from './card.svelte';
  import { getPrintableEntryCards, type PrintableOutputEntry } from '$lib/card-continuations';

  export let entry: PrintableOutputEntry;
  export let side: 'front' | 'back' = 'front';
  export let withBorder = false;
  export let previewScale = 1;
  export let previewMode = false;
  export let style = '';

  $: orderedCards = getPrintableEntryCards(entry, side);
</script>

<div
  class="output-entry-slot"
  class:backside={side === 'back'}
  class:with-border={withBorder}
  class:joined-slot={entry.type === 'joined-pair'}
  class:preview-mode={previewMode}
  style={`--preview-scale: ${previewScale}; ${style}`}
>
  {#if entry.type === 'joined-pair'}
    <div class="joined-card-shell">
      {#each orderedCards as printableCard, index}
        <div class="joined-card-panel">
          {#if previewMode}
            <div class="preview-card-stage">
              <div
                class="preview-card-scale"
                style={`transform: scale(${previewScale}); transform-origin: top left;`}
              >
                {#if side === 'front'}
                  <CardComponent card={printableCard.card} />
                {:else}
                  <CardBack card={printableCard.card} />
                {/if}
              </div>
              {#if index === 0}
                <div class="joined-card-fold" aria-hidden="true"></div>
              {/if}
            </div>
          {:else}
            {#if side === 'front'}
              <CardComponent card={printableCard.card} />
            {:else}
              <CardBack card={printableCard.card} />
            {/if}
            {#if index === 0}
              <div class="joined-card-fold" aria-hidden="true"></div>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  {:else if orderedCards[0]}
    {#if previewMode}
      <div class="preview-card-stage">
        <div
          class="preview-card-scale"
          style={`transform: scale(${previewScale}); transform-origin: top left;`}
        >
          {#if side === 'front'}
            <CardComponent card={orderedCards[0].card} />
          {:else}
            <CardBack card={orderedCards[0].card} />
          {/if}
        </div>
      </div>
    {:else if side === 'front'}
      <CardComponent card={orderedCards[0].card} />
    {:else}
      <CardBack card={orderedCards[0].card} />
    {/if}
  {/if}
</div>

<style lang="scss">
  .output-entry-slot {
    position: relative;
    isolation: isolate;
    height: var(--card-height);
    width: var(--card-width);
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;

    &.backside.with-border {
      &::before {
        position: absolute;
        z-index: 0;
        inset: calc(var(--back-border-width) * -1);
        background-color: var(--card-color);
        content: '';
        pointer-events: none;
      }
    }

    :global(.rpg-card-wrapper),
    .joined-card-shell {
      position: relative;
      z-index: 1;
    }
  }

  .joined-slot {
    width: calc(var(--card-width) * 2);
  }

  .joined-card-shell {
    display: inline-grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    gap: 0;
    width: auto;
    height: 100%;
  }

  .joined-card-panel {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .backside.joined-slot {
    justify-content: flex-end;
  }

  .joined-card-fold {
    position: absolute;
    top: 4%;
    right: -1px;
    width: 2px;
    height: 92%;
    background: repeating-linear-gradient(
      to bottom,
      rgba(71, 85, 105, 0.4),
      rgba(71, 85, 105, 0.4) 4px,
      transparent 4px,
      transparent 8px
    );
    pointer-events: none;
  }

  .preview-mode {
    width: auto;
    height: auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .preview-card-stage {
    --current-card-stage-shadow: rgba(24, 32, 47, 0.18);
    position: relative;
    width: calc(var(--card-width) * var(--preview-scale));
    height: calc(var(--card-height) * var(--preview-scale));
    flex: none;
    filter: drop-shadow(0 1.25rem 2.5rem var(--current-card-stage-shadow));
  }

  .preview-card-scale {
    width: var(--card-width);
    height: var(--card-height);
  }
</style>
