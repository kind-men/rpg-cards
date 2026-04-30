<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import {
    Icon,
    Input
  } from '@sveltestrap/sveltestrap';
  import { generateExportObject, parseCards } from '../lib/card-json-parser';
  import { setPrintSelection } from '../lib/print-selection';
  import type Card from '../model/card';
  import { currentCard, deck, multiSelect, pageLayout } from '../stores';
  import { CARD_SIZE_PRESETS, PAPER_SIZE_PRESETS } from '../stores/page-layout';
  import { settings } from '../stores/settings';
  import Deck from './deck.svelte';
  import Hint from './hint.svelte';
  import DeckEditorDialog from './deck-editor-dialog.svelte';
  import DeckImportDialog from './deck-import-dialog.svelte';
  import SidebarSection from './sidebar-section.svelte';
  import type { ImportEventPayload } from './deck-import-dialog.svelte';

  let importFileSelector: HTMLInputElement;
  let importFiles: FileList;
  let hiddenDownloadLink: HTMLAnchorElement;
  let downloadUrl = undefined;
  let downloadName = 'cards.json';
  let toggleDeckEditor: () => void;
  let toggleDeckImportDialog: () => void;
  let generalMenuOpen = false;
  const addCardsToDeck = (cards: Card[]) => {
    const i = deck.addCards(...cards);
    currentCard.set(i);
  };

  const handleImportFiles = async () => {
    if (importFiles.length === 0) {
      return;
    }
    const file = importFiles[0];
    const jsonText = await file.text();
    const cards = parseCards(
      jsonText,
      $settings.convertFirstSubtitle,
      $settings.convertDndSpellblock
    );
    addCardsToDeck(cards);
  };

  $: importFiles && handleImportFiles();

  const handleImportSampleDeck = async () => {
    const jsonText = await fetch('rpg-cards-sample.json').then((res) => res.text());
    const cards = parseCards(
      jsonText,
      $settings.convertFirstSubtitle,
      $settings.convertDndSpellblock
    );
    addCardsToDeck(cards);
  };

  const handleExportToFile = () => {
    const jsonExport = JSON.stringify(generateExportObject($deck), undefined, 2);
    const blob = new Blob([jsonExport], { type: 'application/json' });
    downloadUrl = URL.createObjectURL(blob);

    hiddenDownloadLink.href = downloadUrl;
    hiddenDownloadLink.click();

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 500);
  };

  const handleImportFromJSONClick = () => {
    generalMenuOpen = false;
    toggleDeckImportDialog();
  };

  const handleNewDeckClick = async () => {
    generalMenuOpen = false;

    const jsonText = await fetch('empty-deck.json').then((res) => res.text());
    const cards = parseCards(
      jsonText,
      $settings.convertFirstSubtitle,
      $settings.convertDndSpellblock
    );

    deck.set(cards);
    multiSelect.clear();
    currentCard.set(-1);
    pageLayout.set({
      paperFormat: 'a4',
      paperSize: { ...PAPER_SIZE_PRESETS.a4 },
      cardFormat: 'poker',
      cardSize: { ...CARD_SIZE_PRESETS.poker },
      adjust: {
        x: undefined,
        y: undefined
      },
      cardBackBorder: 0
    });
  };

  const handleImportFromJSON = (event: CustomEvent<ImportEventPayload>) => {
    addCardsToDeck(event.detail.cards);
  };

  const handleEditJson = () => {
    generalMenuOpen = false;
    toggleDeckEditor();
  };

  const handleOpenPrintView = async () => {
    generalMenuOpen = false;
    setPrintSelection(null);
    await goto(`${base}/print`);
  };

  const closeGeneralMenu = () => {
    generalMenuOpen = false;
  };

  const toggleGeneralMenu = (event: MouseEvent) => {
    event.stopPropagation();
    generalMenuOpen = !generalMenuOpen;
  };

  const handleWindowClick = () => {
    closeGeneralMenu();
  };

  const handleImportFileClick = () => {
    generalMenuOpen = false;
    importFileSelector.click();
  };

  const handleImportSampleDeckClick = async () => {
    generalMenuOpen = false;
    await handleImportSampleDeck();
  };

  const handleExportToFileClick = () => {
    generalMenuOpen = false;
    handleExportToFile();
  };

</script>

<svelte:window on:click={handleWindowClick} />

<div class="sidebar-content">
  <div class="hidden">
    <input type="file" accept=".json" bind:files={importFiles} bind:this={importFileSelector} />
    <a href={downloadUrl} download={downloadName} bind:this={hiddenDownloadLink}>
      Hidden download link
    </a>
  </div>

  <div class="sidebar-toolbar">
    <div
      class="general-menu-popover"
      role="presentation"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <button
        class="general-menu-trigger"
        type="button"
        aria-label="Toggle general actions menu"
        aria-expanded={generalMenuOpen}
        on:click={toggleGeneralMenu}
      >
        <img class="general-menu-trigger-image" src={`${base}/menu-logo.svg`} alt="" />
        <span class:general-menu-chevron-open={generalMenuOpen} class="general-menu-chevron"></span>
      </button>

      {#if generalMenuOpen}
        <div class="general-menu-panel general-menu-panel-top">
          <div class="general-menu-group">
            <button class="general-menu-item" type="button" on:click={handleNewDeckClick}>
              New
            </button>
            <button class="general-menu-item" type="button" on:click={handleImportFileClick}>
              Open
            </button>
            <button class="general-menu-item" type="button" on:click={handleExportToFileClick}>
              Save
            </button>
            <div class="general-menu-divider"></div>

            <button
              class="general-menu-item"
              type="button"
              on:click={handleImportSampleDeckClick}
            >
              Import sample deck
            </button>
            <button class="general-menu-item" type="button" on:click={handleImportFromJSONClick}>
              Import JSON
            </button>
            <button class="general-menu-item" type="button" on:click={handleEditJson}>
              Edit JSON
            </button>
            <button class="general-menu-item" type="button" on:click={handleOpenPrintView}>
              Print
            </button>
          </div>

          <div class="general-menu-divider"></div>

          <div class="general-menu-group">
            <label class="general-toggle-row" for="convert-first-subtitle">
              <span class="general-toggle-label">Convert subtitle + rule to sections</span>
              <div class="general-toggle-controls">
                <Hint id={'convert-first-subtitle-help'}>
                  This will convert subtitles followed by a rule into sections.
                </Hint>
                <Input
                  type="checkbox"
                  id="convert-first-subtitle"
                  bind:checked={$settings.convertFirstSubtitle}
                />
              </div>
            </label>
            <label class="general-toggle-row" for="convert-dnd-spell-block">
              <span class="general-toggle-label">Convert D&amp;D spell blocks</span>
              <div class="general-toggle-controls">
                <Hint id={'convert-dnd-spell-block-help'}>
                  This will convert properties containing Casting Time, Range, Components, and
                  Duration (in that order) into a block.
                </Hint>
                <Input
                  type="checkbox"
                  id="convert-dnd-spell-block"
                  bind:checked={$settings.convertDndSpellblock}
                />
              </div>
            </label>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <SidebarSection grow={true}>
      <Deck />
  </SidebarSection>
  <footer class="sidebar-footer">
    <a
      class="sidebar-footer-link"
      href="https://github.com/kind-men/rpg-cards/"
      target="_blank"
      rel="noreferrer"
      aria-label="Open GitHub repository"
    >
      <Icon name="github" />
    </a>
    <a
      class="sidebar-footer-link"
      href={`${base}/docs`}
      aria-label="Open documentation"
    >
      <Icon name="book" />
    </a>
    <a
      class="sidebar-footer-link"
      href={`${base}/info`}
      aria-label="Open info"
    >
      <Icon name="info-circle-fill" />
    </a>
  </footer>
      <DeckEditorDialog bind:toggle={toggleDeckEditor} />
  <DeckImportDialog bind:toggle={toggleDeckImportDialog} on:import={handleImportFromJSON} />
</div>

<style lang="scss">
  .sidebar-content {
    --sidebar-text-primary: var(--color-ink-900);
    --sidebar-text-strong: var(--color-ink-950);
    --sidebar-text-muted: var(--color-ink-600);
    --sidebar-text-subtle: var(--color-ink-550);
    --sidebar-panel-border: var(--color-border-soft);
    --sidebar-divider: var(--color-border-soft);
    --sidebar-panel-surface: var(--color-white-98);
    --sidebar-hover-surface: var(--color-surface-panel);
    --sidebar-hover-overlay: var(--color-overlay-muted);
    --sidebar-panel-shadow: var(--color-shadow-300);
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .hidden {
    display: none !important;
  }

  .sidebar-toolbar {
    position: relative;
    display: flex;
    justify-content: flex-start;
  }

  .general-menu-popover {
    position: relative;
    flex: 0 0 auto;
  }

  .general-menu-trigger {
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.18rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--sidebar-text-primary);
    transition: color 120ms ease, opacity 120ms ease;
    appearance: none;

    &:hover {
      color: var(--sidebar-text-strong);
      opacity: 0.82;
    }
  }

  .general-menu-trigger-image {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
    object-fit: contain;
    pointer-events: none;
    opacity: 0.8;
  }

  .general-menu-chevron {
    width: 0.27rem;
    height: 0.27rem;
    margin-top: -0.015rem;
    border-right: 1.125px solid currentColor;
    border-bottom: 1.125px solid currentColor;
    transform: rotate(45deg);
    transition: transform 120ms ease;
    pointer-events: none;
  }

  .general-menu-chevron-open {
    transform: rotate(-135deg);
  }

  .general-menu-panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    z-index: 20;
    width: min(18rem, calc(100vw - 4rem));
    padding: 0.35rem;
    border: 1px solid var(--sidebar-panel-border);
    border-radius: var(--bs-border-radius);
    background: var(--sidebar-panel-surface);
    box-shadow: 0 18px 40px var(--sidebar-panel-shadow);
    backdrop-filter: blur(10px);
  }

  .general-menu-panel-top {
    top: calc(100% + 0.35rem);
  }

  .general-menu-group {
    display: grid;
    gap: 0.15rem;
  }

  .general-menu-item {
    width: 100%;
    padding: 0.5rem 0.65rem;
    display: flex;
    align-items: center;
    border: 0;
    border-radius: var(--bs-border-radius);
    background: transparent;
    color: var(--sidebar-text-primary);
    font-size: 0.82rem;
    text-align: left;
    text-decoration: none;

    &:hover {
      background: var(--sidebar-hover-surface);
    }
  }

  .general-menu-divider {
    height: 1px;
    margin: 0.35rem 0;
    background: var(--sidebar-divider);
  }

  .general-toggle-row {
    padding: 0.5rem 0.65rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
    border-radius: var(--bs-border-radius);
    cursor: pointer;

    &:hover {
      background: var(--sidebar-hover-surface);
    }
  }

  .general-toggle-label {
    min-width: 0;
    color: var(--sidebar-text-primary);
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .general-toggle-controls {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.35rem;
  }
  .general-toggle-controls :global(.form-check) {
    margin: 0;
    padding: 0;
    align-content: center;
  }

  .general-toggle-row :global(.form-check-input) {
    margin: 0;
    cursor: pointer;
  }

  .sidebar-footer {
    position: sticky;
    bottom: -1.5rem;
    margin-top: auto;
    padding-top: .5rem;
    padding-bottom: 0;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    background: linear-gradient(to top, var(--color-surface-base) 72%, var(--color-white-0));
  }

  .sidebar-footer-link {
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--sidebar-text-muted);
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease;

    &:hover {
      background: var(--sidebar-hover-overlay);
      color: var(--sidebar-text-primary);
    }

    :global(svg) {
      width: 0.9rem;
      height: 0.9rem;
    }
  }

</style>

