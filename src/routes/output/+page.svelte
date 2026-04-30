<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, tick } from 'svelte';
  import split from 'just-split';
  import { getPrintableCards } from '../../lib/print-selection';
  import CardBack from '../../components/card/card-back.svelte';
  import Card from '../../components/card/card.svelte';
  import { deck, pageLayout } from '../../stores';

  const GAP_BETWEEN = 2;
  const PAGE_PADDING = 5;
  let previewReady = false;
  let previewVisible = false;

  // sizes in mm
  const cardWidth = $pageLayout.cardSize.width;
  const cardWidthWithBorder = cardWidth + ($pageLayout.cardBackBorder || 0) * 2 + GAP_BETWEEN / 2;
  const cardHeight = $pageLayout.cardSize.height;
  const cardHeightWithBorder = cardHeight + ($pageLayout.cardBackBorder || 0) * 2 + GAP_BETWEEN / 2;

  const calculateCardsPerPages = (): number => {
    const cols = Math.floor(($pageLayout.paperSize.width - PAGE_PADDING * 2) / cardWidthWithBorder);
    const rows = Math.floor(
      ($pageLayout.paperSize.height - PAGE_PADDING * 2) / cardHeightWithBorder
    );
    return cols * rows;
  };

  const cardsPerPages = calculateCardsPerPages();
  const printableCards = browser ? getPrintableCards($deck) : $deck;
  const cardGroups = split(printableCards, cardsPerPages);

  onMount(async () => {
    await tick();

    if ('fonts' in document) {
      await document.fonts.ready.catch(() => undefined);
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    previewReady = true;
    requestAnimationFrame(() => {
      previewVisible = true;
    });

    if (browser && window.parent !== window) {
      const previewToken = new URL(window.location.href).searchParams.get('preview') ?? '';
      window.parent.postMessage(
        {
          type: 'rpg-cards-output-ready',
          previewToken
        },
        window.location.origin
      );
    }
  });
</script>

{#if previewReady}
  <div
    id="output"
    class="wrapper"
    class:wrapper-visible={previewVisible}
    style="
      --page-width: {$pageLayout.paperSize.width}mm; 
      --page-height: {$pageLayout.paperSize.height}mm;
      --back-border-width: {$pageLayout.cardBackBorder || 0}mm;
      --card-width: {cardWidth}mm;
      --card-height: {cardHeight}mm;
    "
  >
    {#each cardGroups as cardGroup}
      <div class="paper">
        {#each cardGroup as card}
          <div
            style={`--card-color: ${card.color};`}
            class="card-slot"
            class:with-border={$pageLayout.cardBackBorder > 0}
          >
            <Card {card} />
          </div>
        {/each}
      </div>
      <div
        class="paper backside"
        style="--adjust-x: {$pageLayout.adjust.x || 0}mm; --adjust-y: {$pageLayout.adjust.y || 0}mm;"
      >
        {#each cardGroup as card}
          <div
            style={`--card-color: ${card.color};`}
            class="card-slot backside"
            class:with-border={$pageLayout.cardBackBorder > 0}
          >
            <CardBack {card} />
          </div>
        {/each}
      </div>
      <div style="break-after:page"></div>
    {/each}
  </div>
{:else}
  <div class="output-loading" aria-live="polite">
    <div class="output-loading-spinner" aria-hidden="true"></div>
    <p class="output-loading-text">Preparing pages…</p>
  </div>
{/if}

<style lang="scss">
  $paper-padding: 0.5cm;

  :global(html),
  :global(body) {
    overflow: auto;
    min-height: 100%;
    background: transparent;
  }

  .output-loading {
    min-height: 100vh;
    display: grid;
    place-items: center;
    gap: 0.85rem;
    padding: 2rem;
    background:
      radial-gradient(circle at top, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0) 38%),
      #edf1f6;
    text-align: center;
  }

  .output-loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid rgba(123, 136, 157, 0.26);
    border-top-color: #334155;
    border-radius: 999px;
    animation: output-preview-spin 900ms linear infinite;
  }

  .output-loading-text {
    margin: 0;
    color: #475569;
    font-weight: 600;
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    opacity: 0;
    transition: opacity 180ms ease;
  }

  .wrapper-visible {
    opacity: 1;
  }

  .paper {
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      calc(var(--card-width) + var(--back-border-width) * 2)
    );
    grid-template-rows: repeat(
      auto-fill,
      calc(var(--card-height) + (var(--back-border-width) * 2))
    );

    gap: 2mm;

    padding: $paper-padding;

    width: var(--page-width);
    height: var(--page-height);

    @media screen {
      border: 2px dashed silver;
      margin: 1em;
    }

    &.backside {
      direction: rtl;
      padding-right: calc(0.5cm - var(--adjust-x));
      padding-top: calc(0.5cm - var(--adjust-y));

      * {
        direction: ltr;
      }
    }
  }

  .card-slot {
    height: calc(var(--card-height) + (var(--back-border-width) * 2));
    width: calc(var(--card-width) + (var(--back-border-width) * 2));

    display: flex;
    justify-content: center;
    align-items: center;

    &.backside.with-border {
      background-color: var(--card-color);
    }
  }

  @keyframes output-preview-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
