<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, tick } from 'svelte';
  import { parseCards } from '$lib/card-json-parser';
  import { preloadIconsForCards } from '$lib/icons';
  import { getPrintableCards } from '../../lib/print-selection';
  import { getBleedAwarePrintGrid } from '$lib/print-layout';
  import Card from '../../components/card/card.svelte';
  import PrintableOutputEntryCard from '../../components/card/printable-output-entry.svelte';
  import {
    createPrintableOutputEntries,
    expandDeckToPrintableEntries,
    type PrintableOutputEntry
  } from '../../lib/card-continuations';
  import type CardModel from '../../model/card';
  import { deck, pageLayout } from '../../stores';

  interface PlacedOutputEntry {
    column: number;
    entry: PrintableOutputEntry;
    row: number;
  }

  interface PlacedPage {
    entries: PlacedOutputEntry[];
  }

  const GAP_BETWEEN = 2;
  const PAGE_PADDING = 5;

  let fontsReady = false;
  let deckReady = false;
  let previewReady = false;
  let previewVisible = false;
  let measurementCard: CardModel | null = null;
  let measurementStageElement: HTMLDivElement;
  let printablePages: PlacedPage[] = [];
  let pageColumns = 1;
  let pageRows = 1;
  let buildToken = 0;
  let requestedPreviewKey = '';

  const getCardBackBleed = () => {
    const bleed = Number($pageLayout.cardBackBorder);
    return Number.isFinite(bleed) ? Math.max(0, bleed) : 0;
  };

  const getBacksideColumn = (column: number, span: number) => pageColumns - column - span + 2;

  const findPlacement = (
    occupied: boolean[][],
    span: number,
    totalColumns: number,
    totalRows: number
  ): { column: number; row: number } | null => {
    for (let row = 1; row <= totalRows; row += 1) {
      for (let column = 1; column <= totalColumns - span + 1; column += 1) {
        let isAvailable = true;

        for (let offset = 0; offset < span; offset += 1) {
          if (occupied[row - 1]?.[column - 1 + offset]) {
            isAvailable = false;
            break;
          }
        }

        if (isAvailable) {
          return { column, row };
        }
      }
    }

    return null;
  };

  const placeOutputEntries = (
    entries: PrintableOutputEntry[],
    totalColumns: number,
    totalRows: number
  ): PlacedPage[] => {
    if (entries.length === 0) {
      return [];
    }

    const pages: PlacedPage[] = [];
    let currentEntries: PlacedOutputEntry[] = [];
    let occupied = Array.from({ length: totalRows }, () => Array(totalColumns).fill(false));

    const pushPage = () => {
      if (currentEntries.length > 0) {
        pages.push({ entries: currentEntries });
      }

      currentEntries = [];
      occupied = Array.from({ length: totalRows }, () => Array(totalColumns).fill(false));
    };

    for (const entry of entries) {
      const span = Math.min(entry.span, totalColumns);
      let placement = findPlacement(occupied, span, totalColumns, totalRows);

      if (!placement) {
        pushPage();
        placement = findPlacement(occupied, span, totalColumns, totalRows);
      }

      if (!placement) {
        continue;
      }

      for (let offset = 0; offset < span; offset += 1) {
        occupied[placement.row - 1][placement.column - 1 + offset] = true;
      }

      currentEntries.push({
        entry: {
          ...entry,
          span
        },
        column: placement.column,
        row: placement.row
      });
    }

    pushPage();
    return pages;
  };

  const doesMeasuredCardFit = (): boolean => {
    const contentElement = measurementStageElement?.querySelector(
      '.card-content'
    ) as HTMLElement | null;

    if (!contentElement) {
      return false;
    }

    return contentElement.scrollHeight <= contentElement.clientHeight + 1;
  };

  const measureCardFits = async (card: CardModel, token: number): Promise<boolean> => {
    measurementCard = card;
    await tick();

    if (token !== buildToken) {
      return false;
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return doesMeasuredCardFit();
  };

  const rebuildPreview = async (previewKey: string) => {
    if (!browser || !fontsReady) {
      return;
    }

    const token = ++buildToken;
    requestedPreviewKey = previewKey;
    previewReady = false;
    previewVisible = false;

    const selectedCards = getPrintableCards($deck);
    const printGrid = getBleedAwarePrintGrid({
      paperSize: $pageLayout.paperSize,
      cardSize: $pageLayout.cardSize,
      gap: GAP_BETWEEN,
      pagePadding: PAGE_PADDING,
      bleed: getCardBackBleed()
    });

    pageColumns = printGrid.columns;
    pageRows = printGrid.rows;

    const printableCards = await expandDeckToPrintableEntries(
      selectedCards,
      async (candidateCard) => measureCardFits(candidateCard, token)
    );

    if (token !== buildToken) {
      return;
    }

    const outputEntries = createPrintableOutputEntries(printableCards, pageColumns);
    printablePages = placeOutputEntries(outputEntries, pageColumns, pageRows);
    measurementCard = null;
    await preloadIconsForCards(printableCards.map((entry) => entry.card));

    if (token !== buildToken) {
      return;
    }

    await tick();

    if (token !== buildToken) {
      return;
    }

    previewReady = true;
    requestAnimationFrame(() => {
      if (token !== buildToken) {
        return;
      }

      previewVisible = true;

      if (window.parent !== window) {
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
  };

  const loadDeckForOutput = async () => {
    const previewToken = new URL(window.location.href).searchParams.get('preview') ?? '';

    try {
      const previewDeck = previewToken
        ? sessionStorage.getItem(`rpg-cards-print-deck:${previewToken}`)
        : null;

      if (previewDeck) {
        deck.hydrate(parseCards(previewDeck) ?? []);
        return;
      }
    } catch (error) {
      console.warn('Unable to read print preview deck snapshot.', error);
    }

    await deck.loadStoredDeck();
  };

  onMount(async () => {
    await loadDeckForOutput();
    deckReady = true;

    if ('fonts' in document) {
      await document.fonts.ready.catch(() => undefined);
    }

    fontsReady = true;
  });

  $: if (
    browser &&
    deckReady &&
    fontsReady &&
    $deck &&
    $pageLayout.paperSize.width &&
    $pageLayout.paperSize.height &&
    $pageLayout.cardSize.width &&
    $pageLayout.cardSize.height
  ) {
    const previewKey = JSON.stringify({
      deck: $deck,
      pageLayout: $pageLayout
    });

    if (previewKey !== requestedPreviewKey) {
      void rebuildPreview(previewKey);
    }
  }
</script>

<div
  class="measurement-stage"
  aria-hidden="true"
  bind:this={measurementStageElement}
  style="
    --card-width: {$pageLayout.cardSize.width}mm;
    --card-height: {$pageLayout.cardSize.height}mm;
  "
>
  {#if measurementCard}
    <Card card={measurementCard} />
  {/if}
</div>

{#if previewReady}
  <div
    id="output"
    class="wrapper"
    class:wrapper-visible={previewVisible}
    style="
      --page-width: {$pageLayout.paperSize.width}mm;
      --page-height: {$pageLayout.paperSize.height}mm;
      --back-border-width: {getCardBackBleed()}mm;
      --bleed-excess: {Math.max(0, getCardBackBleed() * 2 - GAP_BETWEEN)}mm;
      --print-gap: {GAP_BETWEEN}mm;
      --card-width: {$pageLayout.cardSize.width}mm;
      --card-height: {$pageLayout.cardSize.height}mm;
      --page-columns: {pageColumns};
      --page-rows: {pageRows};
    "
  >
    {#each printablePages as page}
      <div class="paper">
        {#each page.entries as placed}
          <div
            style={`
              --card-color: ${placed.entry.cards[0]?.card.color};
              grid-column: ${placed.column} / span ${placed.entry.span};
              grid-row: ${placed.row};
            `}
          >
            <PrintableOutputEntryCard
              entry={placed.entry}
              side="front"
              withBorder={getCardBackBleed() > 0}
            />
          </div>
        {/each}
      </div>
      <div
        class="paper backside"
        style="--adjust-x: {$pageLayout.adjust.x || 0}mm; --adjust-y: {$pageLayout.adjust.y ||
          0}mm;"
      >
        {#each page.entries as placed}
          <div
            style={`
              --card-color: ${placed.entry.cards[0]?.card.color};
              grid-column: ${getBacksideColumn(placed.column, placed.entry.span)} / span ${placed.entry.span};
              grid-row: ${placed.row};
            `}
          >
            <PrintableOutputEntryCard
              entry={placed.entry}
              side="back"
              withBorder={getCardBackBleed() > 0}
            />
          </div>
        {/each}
      </div>
      <div style="break-after:page"></div>
    {/each}
  </div>
{:else}
  <div class="output-loading" aria-live="polite">
    <div class="output-loading-spinner" aria-hidden="true"></div>
    <p class="output-loading-text">Preparing pages</p>
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

  .measurement-stage {
    position: fixed;
    top: 0;
    left: -200vw;
    visibility: hidden;
    pointer-events: none;
    z-index: -1;
  }

  .output-loading {
    min-height: 100vh;
    display: grid;
    place-items: center;
    gap: 0.85rem;
    padding: 2rem;
    background:
      radial-gradient(circle at top, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0) 38%), #edf1f6;
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
      var(--page-columns),
      calc(var(--card-width) + var(--bleed-excess))
    );
    grid-template-rows: repeat(var(--page-rows), calc(var(--card-height) + var(--bleed-excess)));
    gap: var(--print-gap);
    padding: $paper-padding;
    width: var(--page-width);
    height: var(--page-height);
    align-content: start;

    @media screen {
      border: 2px dashed silver;
      margin: 1em;
    }

    &.backside {
      justify-content: end;
      justify-items: end;
      padding-left: $paper-padding;
      padding-right: calc(0.5cm - var(--adjust-x));
      padding-top: calc(0.5cm - var(--adjust-y));
    }
  }

  @keyframes output-preview-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
