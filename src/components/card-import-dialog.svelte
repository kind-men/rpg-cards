<script context="module" lang="ts">
  export type CardImportEventPayload = {
    cards: Card[];
  };
</script>

<script lang="ts">
  import { shortcut } from '$lib/shortcut';
  import { CARD_IMPORT_SOURCES, getCardImportSource } from '$lib/card-import/source-registry';
  import { createCardsFromImportedDrafts } from '$lib/card-import/card-import-factory';
  import type {
    CardImportListItem,
    CardImportSource
  } from '$lib/card-import/types';
  import type Card from '$model/card';
  import { createEventDispatcher } from 'svelte';
  import {
    Alert,
    Button,
    Icon,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader
  } from '@sveltestrap/sveltestrap';

  const dispatch = createEventDispatcher<{ import: CardImportEventPayload }>();

  const defaultSourceId = CARD_IMPORT_SOURCES[0]?.id ?? '';

  let open = false;
  let sourceId = defaultSourceId;
  let search = '';
  let items: CardImportListItem[] = [];
  let selectedIds = new Set<string>();
  let listLoading = false;
  let importLoading = false;
  let error: string = undefined;
  let lastLoadedSourceId = '';

  $: activeSource = getCardImportSource(sourceId);
  $: filteredItems = items.filter((item) => {
    if (!search.trim()) {
      return true;
    }

    const haystack = `${item.title} ${item.subtitle ?? ''} ${item.searchText ?? ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });
  $: selectedItems = items.filter((item) => selectedIds.has(item.id));

  $: if (open && activeSource && lastLoadedSourceId !== activeSource.id) {
    void loadItems(activeSource);
  }

  function resetState(): void {
    search = '';
    items = [];
    selectedIds = new Set<string>();
    listLoading = false;
    importLoading = false;
    error = undefined;
    lastLoadedSourceId = '';
  }

  async function loadItems(source: CardImportSource): Promise<void> {
    listLoading = true;
    error = undefined;
    items = [];
    selectedIds = new Set<string>();

    const result = await source.loadItems();

    listLoading = false;
    lastLoadedSourceId = source.id;

    if (result.ok === false) {
      error = result.error.message;
      return;
    }

    items = result.data;
  }

  function toggleSelection(id: string): void {
    const next = new Set(selectedIds);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    selectedIds = next;
  }

  function handleSourceChange(event: Event): void {
    sourceId = (event.currentTarget as HTMLSelectElement).value;
    error = undefined;
    items = [];
    selectedIds = new Set<string>();
    lastLoadedSourceId = '';
  }

  async function handleImportClick(): Promise<void> {
    if (!activeSource || selectedItems.length === 0) {
      return;
    }

    importLoading = true;
    error = undefined;

    const result = await activeSource.importItems(selectedItems);

    importLoading = false;

    if (result.ok === false) {
      error = result.error.message;
      return;
    }

    dispatch('import', {
      cards: createCardsFromImportedDrafts(result.data)
    });
    toggle();
  }

  export const toggle = () => {
    open = !open;

    if (open) {
      sourceId = sourceId || defaultSourceId;
      resetState();
      return;
    }

    resetState();
  };
</script>

<Modal isOpen={open} {toggle} size="xl" backdrop="static">
  <ModalHeader {toggle}>Import Cards</ModalHeader>
  <ModalBody class="card-import-dialog-body">
    <div use:shortcut={{ code: 'Escape', callback: toggle }}></div>

    <div class="dialog-layout">
      <div class="controls-column">
        <div class="form-group">
          <Label for="card-import-source">Source</Label>
          <Input
            id="card-import-source"
            type="select"
            value={sourceId}
            on:change={handleSourceChange}
          >
            {#each CARD_IMPORT_SOURCES as source}
              <option value={source.id}>{source.label}</option>
            {/each}
          </Input>
          {#if activeSource}
            <p class="source-description">{activeSource.description}</p>
          {/if}
        </div>

        <div class="form-group">
          <Label for="card-import-search">Search</Label>
          <Input
            id="card-import-search"
            type="text"
            placeholder="Find cards to import"
            bind:value={search}
            disabled={listLoading || !!error}
          />
        </div>
      </div>

      <div class="list-column">
        {#if error}
          <Alert color="danger">
            <Icon name="exclamation-triangle-fill" />
            &nbsp; {error}
            {#if activeSource}
              <div class="status-actions">
                <Button color="secondary" size="sm" on:click={() => loadItems(activeSource)}>
                  Retry
                </Button>
              </div>
            {/if}
          </Alert>
        {:else if listLoading}
          <div class="status-panel">
            <Icon name="arrow-repeat" />
            <span>Loading cards from {activeSource?.label}...</span>
          </div>
        {:else if filteredItems.length === 0}
          <div class="status-panel">
            <Icon name="inbox" />
            <span>{items.length === 0 ? 'No cards are available from this source.' : 'No cards match your search.'}</span>
          </div>
        {:else}
          <div class="list-header">
            <span>{filteredItems.length} available</span>
            <span>{selectedItems.length} selected</span>
          </div>
          <div class="item-list" role="list">
            {#each filteredItems as item}
              <label class="item-row" role="listitem">
                <input
                  type="checkbox"
                  class="form-check-input"
                  checked={selectedIds.has(item.id)}
                  on:change={() => toggleSelection(item.id)}
                />
                <div class="item-copy">
                  <span class="item-title">{item.title}</span>
                  {#if item.subtitle}
                    <span class="item-subtitle">{item.subtitle}</span>
                  {/if}
                </div>
              </label>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </ModalBody>
  <ModalFooter>
    <Button color="primary" disabled={selectedItems.length === 0 || listLoading || importLoading} on:click={handleImportClick}>
      {#if importLoading}
        Importing...
      {:else}
        Import {selectedItems.length > 0 ? `${selectedItems.length} ${selectedItems.length === 1 ? 'card' : 'cards'}` : 'cards'}
      {/if}
    </Button>
    <Button color="secondary" on:click={toggle}>Cancel</Button>
  </ModalFooter>
</Modal>

<style lang="scss">
  .dialog-layout {
    height: 70vh;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(15rem, 20rem) minmax(0, 1fr);
    gap: 1rem;
  }

  .controls-column,
  .list-column {
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .controls-column {
    gap: 1rem;
  }

  .form-group {
    display: grid;
    gap: 0.35rem;
  }

  .source-description {
    margin: 0;
    color: var(--color-ink-575);
    font-size: 0.84rem;
    line-height: 1.4;
  }

  .list-column {
    min-height: 0;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--bs-border-radius);
    overflow: hidden;
    background: var(--color-white-99);
  }

  .list-header {
    padding: 0.7rem 0.85rem;
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom: 1px solid var(--color-border-soft);
    color: var(--color-ink-575);
    font-size: 0.78rem;
  }

  .item-list {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .item-row {
    margin: 0;
    padding: 0.75rem 0.85rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.65rem;
    align-items: flex-start;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .item-row:hover {
    background: var(--color-surface-panel);
  }

  .item-copy {
    min-width: 0;
    display: grid;
    gap: 0.12rem;
  }

  .item-title {
    color: var(--color-ink-900);
    font-size: 0.92rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .item-subtitle {
    color: var(--color-ink-575);
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .status-panel {
    min-height: 100%;
    padding: 1.5rem;
    display: grid;
    place-items: center;
    gap: 0.5rem;
    color: var(--color-ink-575);
    text-align: center;
  }

  .status-actions {
    margin-top: 0.75rem;
  }

  :global(.card-import-dialog-body) {
    overflow: hidden;
  }

  @media (max-width: 900px) {
    .dialog-layout {
      height: auto;
      grid-template-columns: 1fr;
    }

    .list-column {
      min-height: 50vh;
    }
  }
</style>
