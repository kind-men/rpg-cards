<script context="module" lang="ts">
  export type CopyStyleApplyEventPayload = {
    targetIndexes: number[];
    excludeCardbackImages: boolean;
  };
</script>

<script lang="ts">
  import { shortcut } from '$lib/shortcut';
  import type Card from '$model/card';
  import { createEventDispatcher } from 'svelte';
  import {
    Button,
    Icon,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader
  } from '@sveltestrap/sveltestrap';

  export let sourceCard: Card | undefined;
  export let sourceIndex = -1;
  export let cards: Card[] = [];

  const dispatch = createEventDispatcher<{ apply: CopyStyleApplyEventPayload }>();

  let open = false;
  let search = '';
  let selectedIndexes = new Set<number>();
  let excludeCardbackImages = false;

  $: hasImageCardback = sourceCard?.cardback_mode === 'images';
  $: targetItems = cards
    .map((card, index) => ({ card, index }))
    .filter(({ card, index }) => {
      if (index === sourceIndex) {
        return false;
      }

      const query = search.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return getCardTitle(card).toLowerCase().includes(query);
    });
  $: selectedCount = selectedIndexes.size;
  $: allFilteredSelected =
    targetItems.length > 0 && targetItems.every(({ index }) => selectedIndexes.has(index));

  function getCardTitle(card: Card): string {
    return card?.title?.trim() || 'Untitled card';
  }

  function getCardbackLabel(card: Card): string {
    if (card?.cardback_mode === 'images') {
      const imageCount = card.cardback_images?.length ?? 0;
      return `Image back${imageCount > 0 ? ` (${imageCount})` : ''}`;
    }

    return 'Icon back';
  }

  function resetState(): void {
    search = '';
    selectedIndexes = new Set<number>();
    excludeCardbackImages = false;
  }

  function toggleSelection(index: number): void {
    const next = new Set(selectedIndexes);

    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }

    selectedIndexes = next;
  }

  function toggleFilteredSelection(): void {
    const next = new Set(selectedIndexes);

    if (allFilteredSelected) {
      targetItems.forEach(({ index }) => next.delete(index));
    } else {
      targetItems.forEach(({ index }) => next.add(index));
    }

    selectedIndexes = next;
  }

  function handleApplyClick(): void {
    if (selectedIndexes.size === 0) {
      return;
    }

    dispatch('apply', {
      targetIndexes: Array.from(selectedIndexes.values()),
      excludeCardbackImages: hasImageCardback && excludeCardbackImages
    });
    toggle();
  }

  export const toggle = () => {
    open = !open;
    resetState();
  };
</script>

<Modal isOpen={open} {toggle} size="lg" backdrop="static">
  <ModalHeader {toggle}>Copy Style</ModalHeader>
  <ModalBody class="copy-style-dialog-body">
    <div use:shortcut={{ code: 'Escape', callback: toggle }}></div>

    <div class="copy-style-dialog-layout">
      <div class="copy-style-controls">
        <div class="source-panel">
          <span class="source-label">Source</span>
          <span class="source-title"
            >{sourceCard ? getCardTitle(sourceCard) : 'No card selected'}</span
          >
        </div>

        <div class="form-group">
          <Label for="copy-style-search">Search</Label>
          <Input id="copy-style-search" type="text" placeholder="Find cards" bind:value={search} />
        </div>

        {#if hasImageCardback}
          <label class="image-toggle-row" for="exclude-cardback-images">
            <Input
              id="exclude-cardback-images"
              type="switch"
              checked={excludeCardbackImages}
              on:change={(event) =>
                (excludeCardbackImages = (event.currentTarget as HTMLInputElement).checked)}
            />
            <span class="image-toggle-copy">
              <span class="image-toggle-label">Exclude cardback images</span>
              <span class="image-toggle-description"
                >Keep each target card's current image list.</span
              >
            </span>
          </label>
        {/if}
      </div>

      <div class="target-list-column">
        <div class="list-header">
          <span>{targetItems.length} available</span>
          <span>{selectedCount} selected</span>
        </div>

        {#if targetItems.length === 0}
          <div class="status-panel">
            <Icon name="inbox" />
            <span
              >{cards.length <= 1
                ? 'No other cards are available.'
                : 'No cards match your search.'}</span
            >
          </div>
        {:else}
          <label class="select-filtered-row">
            <input
              type="checkbox"
              class="form-check-input"
              checked={allFilteredSelected}
              on:change={toggleFilteredSelection}
            />
            <span>{allFilteredSelected ? 'Clear filtered cards' : 'Select all filtered cards'}</span
            >
          </label>

          <div class="target-list" role="list">
            {#each targetItems as { card, index }}
              <label class="target-row" role="listitem">
                <input
                  type="checkbox"
                  class="form-check-input"
                  checked={selectedIndexes.has(index)}
                  on:change={() => toggleSelection(index)}
                />
                <span class="color-swatch" style={`--swatch-color: ${card.color};`}></span>
                <span class="target-copy">
                  <span class="target-title">{getCardTitle(card)}</span>
                  <span class="target-meta">{getCardbackLabel(card)}</span>
                </span>
              </label>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </ModalBody>
  <ModalFooter>
    <Button color="primary" disabled={selectedCount === 0} on:click={handleApplyClick}>
      Apply style to {selectedCount}
      {selectedCount === 1 ? 'card' : 'cards'}
    </Button>
    <Button color="secondary" on:click={toggle}>Cancel</Button>
  </ModalFooter>
</Modal>

<style lang="scss">
  .copy-style-dialog-layout {
    height: min(64vh, 34rem);
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(14rem, 17rem) minmax(0, 1fr);
    gap: 1rem;
  }

  .copy-style-controls,
  .target-list-column {
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .copy-style-controls {
    gap: 1rem;
  }

  .source-panel {
    padding: 0.7rem 0.8rem;
    display: grid;
    gap: 0.15rem;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--bs-border-radius);
    background: var(--color-surface-panel);
  }

  .source-label {
    color: var(--color-ink-575);
    font-size: 0.72rem;
    font-weight: 650;
    text-transform: uppercase;
  }

  .source-title {
    min-width: 0;
    color: var(--color-ink-900);
    font-size: 0.92rem;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .form-group {
    display: grid;
    gap: 0.35rem;
  }

  .image-toggle-row {
    margin: 0;
    padding: 0.7rem 0.8rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.65rem;
    align-items: flex-start;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--bs-border-radius);
    cursor: pointer;
  }

  .image-toggle-row :global(.form-check) {
    margin: 0.1rem 0 0;
    padding: 0;
  }

  .image-toggle-row :global(.form-check-input) {
    margin: 0;
    cursor: pointer;
  }

  .image-toggle-copy {
    min-width: 0;
    display: grid;
    gap: 0.15rem;
  }

  .image-toggle-label {
    color: var(--color-ink-900);
    font-size: 0.86rem;
    font-weight: 650;
    line-height: 1.25;
  }

  .image-toggle-description {
    color: var(--color-ink-575);
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .target-list-column {
    border: 1px solid var(--color-border-soft);
    border-radius: var(--bs-border-radius);
    overflow: hidden;
    background: var(--color-white-99);
  }

  .list-header,
  .select-filtered-row {
    padding: 0.65rem 0.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-bottom: 1px solid var(--color-border-soft);
    color: var(--color-ink-575);
    font-size: 0.78rem;
  }

  .select-filtered-row {
    justify-content: flex-start;
    cursor: pointer;
  }

  .select-filtered-row :global(.form-check-input) {
    margin: 0;
  }

  .target-list {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .target-row {
    margin: 0;
    padding: 0.7rem 0.8rem;
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    gap: 0.65rem;
    align-items: center;
    border-bottom: 1px solid var(--color-border-soft);
    cursor: pointer;
  }

  .target-row:hover {
    background: var(--color-surface-panel);
  }

  .target-row :global(.form-check-input) {
    margin: 0;
  }

  .color-swatch {
    width: 1rem;
    height: 1rem;
    border: 1px solid var(--color-border-medium);
    border-radius: 999px;
    background: var(--swatch-color);
    box-shadow: inset 0 0 0 2px var(--color-white-75);
  }

  .target-copy {
    min-width: 0;
    display: grid;
    gap: 0.1rem;
  }

  .target-title {
    min-width: 0;
    color: var(--color-ink-900);
    font-size: 0.9rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .target-meta {
    color: var(--color-ink-575);
    font-size: 0.76rem;
    line-height: 1.25;
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

  :global(.copy-style-dialog-body) {
    overflow: hidden;
  }

  @media (max-width: 760px) {
    .copy-style-dialog-layout {
      height: auto;
      grid-template-columns: 1fr;
    }

    .target-list-column {
      min-height: 50vh;
    }
  }
</style>
