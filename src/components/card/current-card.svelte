<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { settings } from '../../stores/settings';
  import { Button, Icon, Input, InputGroup, InputGroupText } from '@sveltestrap/sveltestrap';
  import { currentCard, deck, pageLayout } from '../../stores';
  import type CardModel from '$model/card';
  import CardComponent from './card.svelte';
  import PrintableOutputEntryCard from './printable-output-entry.svelte';
  import {
    applyContinuationPairing,
    createPrintableOutputEntries,
    expandCardToPrintableEntries,
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

    previewEntries = createPrintableOutputEntries(
      applyContinuationPairing(expandedCards, card.layout?.pair_continuations === true),
      2
    );
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
                <PrintableOutputEntryCard
                  entry={previewEntry}
                  side="front"
                  previewMode={true}
                  previewScale={$settings.previewZoom / 100}
                  withBorder={$pageLayout.cardBackBorder > 0}
                  style={`
                    --card-width: ${$pageLayout.cardSize.width}mm;
                    --card-height: ${$pageLayout.cardSize.height}mm;
                    --back-border-width: ${$pageLayout.cardBackBorder || 0}mm;
                    --card-color: ${previewEntry.cards[0]?.card.color};
                  `}
                />
              </div>
            {/each}
          </div>
        </div>

        <div class="card-preview-section">
          <div class="card-preview-label">Back</div>
          <div class="card-preview-row">
            {#each previewEntries as previewEntry}
              <div class:card-stage-pair={previewEntry.type === 'joined-pair'} class="card-stage-shell">
                <PrintableOutputEntryCard
                  entry={previewEntry}
                  side="back"
                  previewMode={true}
                  previewScale={$settings.previewZoom / 100}
                  withBorder={$pageLayout.cardBackBorder > 0}
                  style={`
                    --card-width: ${$pageLayout.cardSize.width}mm;
                    --card-height: ${$pageLayout.cardSize.height}mm;
                    --back-border-width: ${$pageLayout.cardBackBorder || 0}mm;
                    --card-color: ${previewEntry.cards[0]?.card.color};
                  `}
                />
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
