<script lang="ts">
  import {
    Accordion,
    AccordionItem,
    Form,
    FormGroup,
    Icon,
    Input,
    InputGroup,
    InputGroupText,
    Label
  } from 'sveltestrap';
  import { createEventDispatcher } from 'svelte';
  import { generateExportObject, parseCards } from '../lib/card-json-parser';
  import type Card from '../model/card';
  import type { CardFormat } from '../model/page-layout';
  import { CARD_SIZE_PRESETS, currentCard, deck, pageLayout } from '../stores';
  import { settings } from '../stores/settings';
  import Deck from './deck.svelte';
  import Hint from './hint.svelte';
  import JsonEditorModal from './json-editor-modal.svelte';
  import JsonImportModal, { ImportEventPayload } from './json-import-modal.svelte';

  let importFileSelector: HTMLInputElement;
  let importFiles: FileList;
  let hiddenDownloadLink: HTMLAnchorElement;
  let downloadUrl = undefined;
  let downloadName = 'cards.json';

  let toggleJsonEditor: () => void;
  let toggleJsonImportModal: () => void;
  let generalMenuOpen = false;
  const dispatch = createEventDispatcher<{ info: void }>();

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
    toggleJsonImportModal();
  };

  const handleImportFromJSON = (event: CustomEvent<ImportEventPayload>) => {
    addCardsToDeck(event.detail.cards);
  };

  const handleEditJson = () => {
    generalMenuOpen = false;
    toggleJsonEditor();
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

  const cardFormatOptions: { value: CardFormat; label: string }[] = [
    { value: 'poker', label: 'Poker' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'tarot', label: 'Tarot' },
    { value: 'square-1', label: 'Square (1 inches)' },
    { value: 'square-2', label: 'Square (2 inches)' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleCardFormatChange = (cardFormat: CardFormat) => {
    pageLayout.update((layout) => ({
      ...layout,
      cardFormat,
      cardSize:
        cardFormat === 'custom' ? layout.cardSize : { ...CARD_SIZE_PRESETS[cardFormat] }
    }));
  };

  const handleCardFormatSelectChange = (event: Event) => {
    handleCardFormatChange((event.currentTarget as HTMLSelectElement).value as CardFormat);
  };

  const handleCustomCardSizeChange = (
    dimension: 'width' | 'height',
    event: Event
  ) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);

    pageLayout.update((layout) => ({
      ...layout,
      cardFormat: 'custom',
      cardSize: {
        ...layout.cardSize,
        [dimension]: value
      }
    }));
  };
</script>

<svelte:window on:click={handleWindowClick} />

<div class="sidebar-shell">
  <div class="hidden">
    <input type="file" accept=".json" bind:files={importFiles} bind:this={importFileSelector} />
    <a href={downloadUrl} download={downloadName} bind:this={hiddenDownloadLink}>
      Hidden download link
    </a>
  </div>

  <div class="sidebar-toolbar">
    <div class="general-menu-popover" on:click|stopPropagation>
      <button
        class="general-menu-trigger"
        type="button"
        aria-label="Open general actions menu"
        aria-expanded={generalMenuOpen}
        on:click={toggleGeneralMenu}
      >
        <span />
        <span />
        <span />
      </button>

      {#if generalMenuOpen}
        <div class="general-menu-panel general-menu-panel-top">
          <div class="general-menu-group">
            <button class="general-menu-item" type="button" on:click={handleImportFileClick}>
              Import from file
            </button>
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
            <button class="general-menu-item" type="button" on:click={handleExportToFileClick}>
              Export to file
            </button>
            <a class="general-menu-item" href="/output" on:click={closeGeneralMenu}>Print</a>
            <button class="general-menu-item" type="button" on:click={handleEditJson}>
              Edit JSON
            </button>
          </div>

          <div class="general-menu-divider" />

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

  <Accordion stayOpen>
    <AccordionItem active header="Page">
      <Form>
        <FormGroup>
          <span>
            <Label for="paper-size">Paper size</Label>
          </span>
          <InputGroup id="paper-size">
            <Input
              id="paper-size-width"
              placeholder="Width"
              type="number"
              bind:value={$pageLayout.paperSize.width}
            />
            <InputGroupText>mm</InputGroupText>
            <Input
              id="paper-size-height"
              placeholder="Height"
              type="number"
              bind:value={$pageLayout.paperSize.height}
            />
            <InputGroupText>mm</InputGroupText>
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <span>
            <Label for="card-size-format">Card size</Label>
          </span>
          <Input
            id="card-size-format"
            type="select"
            value={$pageLayout.cardFormat}
            on:change={handleCardFormatSelectChange}
          >
            {#each cardFormatOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </Input>
        </FormGroup>
        {#if $pageLayout.cardFormat === 'custom'}
          <FormGroup>
            <span>
              <Label for="custom-card-size">Custom</Label>
            </span>
            <InputGroup id="custom-card-size">
              <Input
                id="custom-card-size-width"
                placeholder="Width"
                type="number"
                value={$pageLayout.cardSize.width}
                on:input={(event) => handleCustomCardSizeChange('width', event)}
              />
              <InputGroupText>mm</InputGroupText>
              <Input
                id="custom-card-size-height"
                placeholder="Height"
                type="number"
                value={$pageLayout.cardSize.height}
                on:input={(event) => handleCustomCardSizeChange('height', event)}
              />
              <InputGroupText>mm</InputGroupText>
            </InputGroup>
          </FormGroup>
        {/if}
        <FormGroup>
          <span>
            <Label for="page-adjust">Print adjust</Label>
            <Hint id="page-adjust-help">
              Use this to adjust the print in order to make up for difference in printers
            </Hint>
          </span>
          <InputGroup id="page-adjust">
            <Input
              id="page-adjust-x"
              placeholder="X"
              type="number"
              bind:value={$pageLayout.adjust.x}
            />
            <InputGroupText>mm</InputGroupText>
            <Input
              id="page-adjust-y"
              placeholder="Y"
              type="number"
              bind:value={$pageLayout.adjust.y}
            />
            <InputGroupText>mm</InputGroupText>
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <span>
            <Label for="card-back-border">Cardback border</Label>
            <Hint id="card-back-border-hint">
              Use this add a colored border around the back of the cards when printing to make up
              for printing variances.
            </Hint>
          </span>
          <InputGroup id="card-back-border">
            <Input
              id="card-back-border-input"
              placeholder="Cardback border"
              type="number"
              bind:value={$pageLayout.cardBackBorder}
            />
            <InputGroupText>mm</InputGroupText>
          </InputGroup>
        </FormGroup>
      </Form>
    </AccordionItem>
    <AccordionItem active header="Deck">
      <Deck />
    </AccordionItem>
  </Accordion>
  <footer class="sidebar-footer">
    <a
      class="sidebar-footer-link"
      href="https://github.com/mathiasandresen/rpg-cards"
      target="_blank"
      rel="noreferrer"
      aria-label="Open GitHub repository"
    >
      <Icon name="github" />
    </a>
    <button
      class="sidebar-footer-link"
      type="button"
      aria-label="Open info dialog"
      on:click={() => dispatch('info')}
    >
      <Icon name="info-circle-fill" />
    </button>
  </footer>
  <JsonEditorModal bind:toggle={toggleJsonEditor} />
  <JsonImportModal bind:toggle={toggleJsonImportModal} on:import={handleImportFromJSON} />
</div>

<style lang="scss">
  .sidebar-shell {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .hidden {
    display: none !important;
  }

  .sidebar-toolbar {
    position: relative;
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: flex-start;
  }

  .general-menu-popover {
    position: relative;
    flex: 0 0 auto;
  }

  .general-menu-trigger {
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.18rem;
    border: 1px solid rgba(18, 38, 63, 0.1);
    border-radius: 0.6rem;
    background: #f6f4ef;
    color: #223047;
    transition: background-color 120ms ease, border-color 120ms ease;

    &:hover {
      background: #efebe2;
      border-color: rgba(18, 38, 63, 0.16);
    }

    span {
      width: 0.8rem;
      height: 1.5px;
      border-radius: 999px;
      background: currentColor;
    }
  }

  .general-menu-panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    z-index: 20;
    width: min(18rem, calc(100vw - 4rem));
    padding: 0.35rem;
    border: 1px solid rgba(18, 38, 63, 0.1);
    border-radius: var(--bs-border-radius);
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 18px 40px rgba(18, 38, 63, 0.12);
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
    color: #223047;
    font-size: 0.82rem;
    text-align: left;
    text-decoration: none;

    &:hover {
      background: #f6f4ef;
    }
  }

  .general-menu-divider {
    height: 1px;
    margin: 0.35rem 0;
    background: rgba(18, 38, 63, 0.08);
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
      background: #f6f4ef;
    }
  }

  .general-toggle-label {
    min-width: 0;
    color: #223047;
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
    padding-top: 1rem;
    padding-bottom: 0.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    background: linear-gradient(to top, #ffffff 72%, rgba(255, 255, 255, 0));
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
    color: #5e6b81;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease;

    &:hover {
      background: rgba(18, 38, 63, 0.06);
      color: #223047;
    }

    :global(svg) {
      width: 0.9rem;
      height: 0.9rem;
    }
  }
</style>
