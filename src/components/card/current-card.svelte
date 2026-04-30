<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { settings } from '../../stores/settings';
  import { Button, Icon, Input, InputGroup, InputGroupText } from '@sveltestrap/sveltestrap';
  import { currentCard, deck, pageLayout } from '../../stores';
  import type CardModel from '$model/card';
  import CardComponent from './card.svelte';
  import CardBack from './card-back.svelte';
  import {
    createPrintableOutputEntries,
    expandCardToPrintableEntries,
    type PrintableCardEntry,
    type PrintableOutputEntry
  } from '$lib/card-continuations';

  let measurementStageElement: HTMLDivElement;
  let measurementCard: CardModel | null = null;
  let previewEntries: PrintableOutputEntry[] = [];
  let fontsReady = false;
  let buildToken = 0;

  $: card = $deck[$currentCard];

  const doesMeasuredCardFit = (): boolean => {
    const contentElement = measurementStageElement?.querySelector('.card-content') as HTMLElement | null;
    if (!contentElement) {
      return false;
    }

    return contentElement.scrollHeight <= contentElement.clientHeight + 1;
  };

  const rebuildPreview = async () => {
    if (!card || !fontsReady) {
      previewEntries = [];
      measurementCard = null;
      return;
    }

    const token = ++buildToken;

    const expandedCards = await expandCardToPrintableEntries(card, $currentCard, async (candidateCard) => {
      if (token !== buildToken) {
        return false;
      }

      measurementCard = candidateCard;
      await tick();

      if (token !== buildToken) {
        return false;
      }

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return doesMeasuredCardFit();
    });

    if (token !== buildToken) {
      return;
    }

    const pairEnabled = card.layout?.pair_continuations === true;
    const entriesWithPairing: PrintableCardEntry[] = expandedCards.map((entry) => ({ ...entry }));

    if (pairEnabled && entriesWithPairing.length > 1) {
      entriesWithPairing.forEach((entry, index) => {
        if (index + 1 >= entriesWithPairing.length && index % 2 === 0) {
          return;
        }

        entry.joinPairKey = `${entry.sourceIndex}:${Math.floor(index / 2)}`;
        entry.joinPairPosition = index % 2 === 0 ? 'start' : 'end';
      });
    }

    previewEntries = createPrintableOutputEntries(entriesWithPairing, 2);
    measurementCard = null;
  };

  onMount(async () => {
    if ('fonts' in document) {
      await document.fonts.ready.catch(() => undefined);
    }

    fontsReady = true;
  });

  $: if (
    card &&
    fontsReady &&
    $pageLayout.cardSize.width &&
    $pageLayout.cardSize.height &&
    $settings.previewZoom
  ) {
    void rebuildPreview();
  }
</script>

<div class="canvas">
  <div class="zoom-input shadow-sm">
    <InputGroup>
      <InputGroupText class="p-0">
        <Button color="link" on:click={() => ($settings.previewZoom -= 10)}>
          <Icon name="zoom-out" />
        </Button>
      </InputGroupText>
      <Input type="number" bind:value={$settings.previewZoom} />
      <InputGroupText>%</InputGroupText>
      <InputGroupText class="p-0">
        <Button color="link" on:click={() => ($settings.previewZoom += 10)}>
          <Icon name="zoom-in" />
        </Button>
      </InputGroupText>
    </InputGroup>
  </div>

  <div class="measurement-stage" aria-hidden="true" bind:this={measurementStageElement}>
    {#if measurementCard}
      <CardComponent card={measurementCard} />
    {/if}
  </div>

  {#if card}
    <div class="current-card">
      <div class="card-preview-stack">
        <div class="card-preview-section">
          <div class="card-preview-label">Front</div>
          <div class="card-preview-row">
            {#each previewEntries as previewEntry}
              <div class:card-stage-pair={previewEntry.type === 'joined-pair'} class="card-stage-shell">
                {#if previewEntry.type === 'joined-pair'}
                  <div class="pair-stage">
                    {#each previewEntry.cards as printableCard, index}
                      <div
                        class="card-stage"
                        style="
                          width: {$pageLayout.cardSize.width * ($settings.previewZoom / 100)}mm;
                          height: {$pageLayout.cardSize.height * ($settings.previewZoom / 100)}mm;
                        "
                      >
                        <div
                          style="transform: scale({$settings.previewZoom / 100}); transform-origin: top left;"
                        >
                          <CardComponent card={printableCard.card} />
                        </div>
                        {#if index === 0}
                          <div class="pair-stage-fold" aria-hidden="true"></div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div
                    class="card-stage"
                    style="
                      width: {$pageLayout.cardSize.width * ($settings.previewZoom / 100)}mm;
                      height: {$pageLayout.cardSize.height * ($settings.previewZoom / 100)}mm;
                    "
                  >
                    <div style="transform: scale({$settings.previewZoom / 100}); transform-origin: top left;">
                      <CardComponent card={previewEntry.cards[0].card} />
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <div class="card-preview-section">
          <div class="card-preview-label">Back</div>
          <div class="card-preview-row">
            {#each previewEntries as previewEntry}
              <div class:card-stage-pair={previewEntry.type === 'joined-pair'} class="card-stage-shell">
                {#if previewEntry.type === 'joined-pair'}
                  <div class="pair-stage">
                    {#each [...previewEntry.cards].reverse() as printableCard, index}
                      <div
                        class="card-stage"
                        style="
                          width: {$pageLayout.cardSize.width * ($settings.previewZoom / 100)}mm;
                          height: {$pageLayout.cardSize.height * ($settings.previewZoom / 100)}mm;
                        "
                      >
                        <div
                          style="transform: scale({$settings.previewZoom / 100}); transform-origin: top left;"
                        >
                          <CardBack card={printableCard.card} />
                        </div>
                        {#if index === 0}
                          <div class="pair-stage-fold" aria-hidden="true"></div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div
                    class="card-stage"
                    style="
                      width: {$pageLayout.cardSize.width * ($settings.previewZoom / 100)}mm;
                      height: {$pageLayout.cardSize.height * ($settings.previewZoom / 100)}mm;
                    "
                  >
                    <div style="transform: scale({$settings.previewZoom / 100}); transform-origin: top left;">
                      <CardBack card={previewEntry.cards[0].card} />
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .canvas {
    --current-card-canvas-glow: var(--color-white-90);
    --current-card-canvas-paper: rgba(244, 241, 231, 0.96);
    --current-card-grid-line: rgba(24, 32, 47, 0.04);
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    background:
      radial-gradient(circle at top, var(--current-card-canvas-glow), var(--current-card-canvas-paper)),
      linear-gradient(90deg, var(--current-card-grid-line) 1px, transparent 1px),
      linear-gradient(var(--current-card-grid-line) 1px, transparent 1px);
    background-size: auto, 32px 32px, 32px 32px;
    background-position: 0 0, center center, center center;
  }

  .measurement-stage {
    position: fixed;
    left: -200vw;
    top: 0;
    visibility: hidden;
    pointer-events: none;
    z-index: -1;
  }

  .zoom-input {
    --current-card-zoom-surface: var(--color-white-96);
    position: sticky;
    top: 1rem;
    left: 1rem;
    z-index: 2;
    margin: 1rem;
    width: 13em;
    background: var(--current-card-zoom-surface);
    border-radius: 0.75rem;
  }

  .current-card {
    display: flex;
    min-height: calc(100% - 5rem);
    padding: 2rem;
    align-items: center;
    justify-content: center;
  }

  .card-preview-stack {
    display: grid;
    gap: 2rem;
  }

  .card-preview-section {
    display: grid;
    gap: 0.75rem;
  }

  .card-preview-label {
    color: var(--color-ink-575);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .card-preview-row {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  }

  .card-stage-shell {
    display: flex;
  }

  .card-stage-pair {
    padding: 0.75rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.36);
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  }

  .pair-stage {
    display: flex;
    gap: 0;
  }

  .card-stage {
    --current-card-stage-shadow: rgba(24, 32, 47, 0.18);
    position: relative;
    flex: none;
    filter: drop-shadow(0 1.25rem 2.5rem var(--current-card-stage-shadow));
  }

  .pair-stage-fold {
    position: absolute;
    top: 4%;
    right: -1px;
    width: 2px;
    height: 92%;
    background:
      repeating-linear-gradient(
        to bottom,
        rgba(71, 85, 105, 0.45),
        rgba(71, 85, 105, 0.45) 4px,
        transparent 4px,
        transparent 8px
      );
    pointer-events: none;
  }

  @media (max-width: 1100px) {
    .canvas {
      min-height: 70vh;
      border-radius: 1rem;
    }

    .current-card {
      min-height: calc(70vh - 5rem);
    }
  }
</style>
