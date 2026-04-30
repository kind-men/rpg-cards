<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { Button, Icon, Input, InputGroup, InputGroupText, Label, Tooltip } from '@sveltestrap/sveltestrap';
  import { setPrintSelection } from '../lib/print-selection';
  import type Card from '../model/card';
  import type { CardFormat } from '../model/page-layout';
  import { createNewCard } from '../lib/card-builder';
  import { cloneCardContentsWithNewIds } from '../lib/card-content';
  import { CARD_SIZE_PRESETS, currentCard, deck, multiSelect, pageLayout } from '../stores';
  import ConfirmationDialog from './confirmation-dialog.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ import: void }>();

  const cardFormatOptions: { value: CardFormat; label: string }[] = [
    { value: 'poker', label: 'Poker' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'tarot', label: 'Tarot' },
    { value: 'square-1', label: 'Square (1 inches)' },
    { value: 'square-2', label: 'Square (2 inches)' },
    { value: 'custom', label: 'Custom' }
  ];

  let cards: Card[];
  $: {
    cards = $deck;
    if (cards && cards.length === 0) {
      currentCard.set(-1);
    }
  }

  const handleClick = (index: number) => {
    currentCard.set(-1);
    currentCard.set(index);
  };

  const handleAddCard = () => {
    const index = deck.addCards(createNewCard());
    currentCard.set(index);
  };

  const handleImportCards = () => {
    dispatch('import');
  };

  const handleDeleteCard = (index: number) => {
    deck.removeCards(index);
    if ($currentCard > $deck.length - 1) {
      currentCard.set($deck.length - 1);
    }
  };

  const handleDeleteSelected = () => {
    deck.removeCards(...$multiSelect.values());
    multiSelect.clear();
  };

  const handlePrintSelected = async () => {
    setPrintSelection(Array.from($multiSelect.values()));
    await goto(`${base}/print`);
  };

  const handleSelectAll = () => {
    if ($deck.every((_, index) => $multiSelect.has(index))) {
      currentCard.set(-2);
      multiSelect.clear();
      return;
    }

    multiSelect.add(...$deck.map((_, index) => index));
    currentCard.set(-1);
  };

  const handleCheckBox = (index: number, value: boolean): void => {
    if (value) {
      multiSelect.add(index);
    } else {
      multiSelect.remove(index);
    }
  };

  const handleDuplicateCard = (card: Card): void => {
    const newCard = {
      ...card,
      contents: cloneCardContentsWithNewIds(card.contents)
    } as Card;

    deck.addCards(newCard);
    currentCard.set($deck.length - 1);
  };

  const handleCardFormatChange = (cardFormat: CardFormat) => {
    pageLayout.update((layout) => ({
      ...layout,
      cardFormat,
      cardSize:
        cardFormat === 'custom' ? layout.cardSize : { ...CARD_SIZE_PRESETS[cardFormat] }
    }));
  };

  const handleCustomCardSizeChange = (dimension: 'width' | 'height', event: Event) => {
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

  const getCardDisplayTitle = (card: Card) => card.title || 'Untitled card';
</script>

<ConfirmationDialog let:confirm={confirmThis} danger>
  <div class="deck-wrapper">
    <div class="deck-header">
      <h2 class="deck-title">Deck</h2>
      <div class="deck-toolbar">
        <button class="deck-toolbar-button" type="button" aria-label="Import cards" on:click={handleImportCards}>
          <Icon name="download" />
        </button>
        <button class="deck-toolbar-button" type="button" on:click={handleAddCard}>
          <Icon name="plus-lg" />
        </button>
      </div>
    </div>

    <div class="deck-settings">
      <div class="deck-settings-field">
        <div class="deck-size-toggle-group" role="group" aria-label="Card size">
          {#each cardFormatOptions as option}
            <Button
              type="button"
              color="link"
              class={`deck-size-toggle ${$pageLayout.cardFormat === option.value ? 'deck-size-toggle-active' : ''}`}
              aria-pressed={$pageLayout.cardFormat === option.value}
              on:click={() => handleCardFormatChange(option.value)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>
      {#if $pageLayout.cardFormat === 'custom'}
        <div class="deck-settings-field">
          <Label class="col-form-label" for="custom-card-size">Custom</Label>
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
        </div>
      {/if}
    </div>

    <div class="deck-list" role="list">
      {#if cards && cards.length > 0}
        <div class="deck-list-header">
          <label class="deck-select-all">
            <input
              on:click={(e) => e.stopPropagation()}
              on:change={handleSelectAll}
              checked={$multiSelect.size === $deck.length}
              type="checkbox"
              class="form-check-input"
            />
            <span>Cards</span>
            {#if $multiSelect.size > 1}
              <span class="deck-count">{$multiSelect.size}</span>
            {/if}
          </label>
          <div class="deck-header-actions">
            {#if $multiSelect.size > 0}
              <button
                class="deck-header-action"
                type="button"
                aria-label={`Print ${$multiSelect.size} selected ${$multiSelect.size === 1 ? 'card' : 'cards'}`}
                on:click={handlePrintSelected}
              >
                <Icon name="printer" />
              </button>
            {/if}
            {#if $multiSelect.size > 1}
              <button
                class="deck-header-action"
                type="button"
                disabled={$multiSelect.size < 2}
                on:click={() =>
                  confirmThis({
                    func: handleDeleteSelected,
                    title: `Delete ${$multiSelect.size} cards?`,
                    body: `Are you sure you want to delete ${$multiSelect.size} cards?`
                  })}
              >
                <Icon name="trash" />
              </button>
            {/if}
          </div>
        </div>

        {#each cards as card, index}
          <div
            class="deck-row"
            class:is-active={($multiSelect.size === 0 && index === $currentCard) || $multiSelect.has(index)}
            role="button"
            tabindex="0"
            on:click={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClick(index);
            }}
            on:keydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(index);
              }
            }}
          >
            <div class="deck-row-main">
              <input
                on:click={(e) => e.stopPropagation()}
                on:change={(e) => handleCheckBox(index, e.currentTarget.checked)}
                checked={$multiSelect.has(index)}
                type="checkbox"
                class="form-check-input"
              />
              <span class="deck-row-icon">
                <Icon name="phone" />
              </span>
              <span class="deck-row-title">{getCardDisplayTitle(card)}</span>
            </div>
            <div class="deck-row-actions">
              <button
                id="duplicate-button-{index}"
                class="deck-row-action"
                type="button"
                aria-label="Duplicate card"
                on:click={(e) => {
                  e.stopPropagation();
                  handleDuplicateCard(card);
                }}
              >
                <Icon name="files" />
              </button>
              <Tooltip target={`duplicate-button-${index}`} placement="right">Duplicate</Tooltip>

              <button
                id="delete-button-{index}"
                class="deck-row-action"
                type="button"
                aria-label="Delete card"
                on:click={(e) => {
                  e.stopPropagation();
                  confirmThis({
                    func: () => handleDeleteCard(index),
                    title: `Delete ${getCardDisplayTitle(card)}`,
                    body: `Are you sure you want to delete ${getCardDisplayTitle(card)}?`
                  });
                }}
              >
                <Icon name="trash" />
              </button>
              <Tooltip target={`delete-button-${index}`} placement="right">Delete</Tooltip>
            </div>
          </div>
        {/each}
      {:else}
        <div class="empty-deck">There are no cards in your deck.</div>
      {/if}
    </div>
  </div>
</ConfirmationDialog>

<style lang="scss">
  .deck-wrapper {
    --deck-text-primary: var(--color-ink-900);
    --deck-text-muted: var(--color-ink-575);
    --deck-text-subtle: var(--color-ink-550);
    --deck-text-faint: var(--color-ink-500);
    --deck-divider: var(--color-border-soft);
    --deck-chip-border: var(--color-border-medium);
    --deck-chip-border-active: var(--color-border-active);
    --deck-hover-overlay: var(--color-overlay-muted);
    --deck-row-hover: var(--color-overlay-faint);
    --deck-chip-surface: var(--color-surface-panel);
    --deck-chip-surface-hover: var(--color-surface-panel-strong);
    --deck-chip-surface-active: var(--color-surface-panel-active);
    --deck-selected-surface: var(--color-surface-selected);
    --deck-chip-shadow: var(--color-shadow-200);
    min-height: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }

  .deck-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.6rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--deck-divider);
  }

  .deck-title {
    margin: 0;
    color: var(--deck-text-primary);
    font-size: var(--section-title-size);
    font-weight: var(--section-title-weight);
    letter-spacing: var(--section-title-spacing);
    text-transform: none;
  }

  .deck-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 0.25rem;
  }

  .deck-toolbar-button,
  .deck-header-action,
  .deck-row-action {
    width: 1.7rem;
    height: 1.7rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--deck-text-subtle);
    transition: background-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }

  .deck-toolbar-button:hover,
  .deck-header-action:hover,
  .deck-row-action:hover {
    background: var(--deck-hover-overlay);
    color: var(--deck-text-primary);
  }

  .deck-toolbar-button:disabled,
  .deck-header-action:disabled,
  .deck-row-action:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .deck-list {
    min-height: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 0.1rem;
    overflow-y: auto;
    padding-right: 0.2rem;
  }

  .deck-settings {
    margin-bottom: 0.75rem;
    display: grid;
    gap: 0.5rem;
  }

  .deck-settings-field {
    display: grid;
    gap: 0.25rem;
  }

  .deck-settings :global(.col-form-label) {
    padding: 0;
    color: var(--deck-text-primary);
    font-size: var(--editor-form-font-size);
    line-height: var(--editor-form-label-line-height);
  }

  .deck-settings :global(.form-control),
  .deck-settings :global(.input-group-text),
  .deck-settings :global(.form-select),
  .deck-settings :global(input),
  .deck-settings :global(select) {
    font-size: var(--editor-form-font-size);
  }

  .deck-settings :global(.form-control),
  .deck-settings :global(.input-group-text),
  .deck-settings :global(.form-select) {
    padding-left: var(--editor-form-control-padding-x);
    padding-right: var(--editor-form-control-padding-x);
    padding-top: var(--editor-form-control-padding-y);
    padding-bottom: var(--editor-form-control-padding-y);
    border-radius: var(--editor-form-control-radius);
  }

  .deck-size-toggle-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .deck-settings :global(.deck-size-toggle) {
    min-height: 1.7rem;
    padding: 0.15rem 0.55rem;
    border: 1px solid var(--deck-chip-border);
    border-radius: 999px;
    background: var(--deck-chip-surface);
    color: var(--deck-text-muted);
    opacity: 0.6;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
  }

  .deck-settings :global(.deck-size-toggle:hover) {
    color: var(--deck-text-primary);
    background: var(--deck-chip-surface-hover);
    opacity: 0.8;
  }

  .deck-settings :global(.deck-size-toggle.deck-size-toggle-active),
  .deck-settings :global(.deck-size-toggle[aria-pressed='true']) {
    color: var(--deck-text-primary);
    border-color: var(--deck-chip-border-active);
    background: var(--deck-chip-surface-active);
    opacity: 1;
    box-shadow: inset 0 1px 2px var(--deck-chip-shadow);
  }

  .deck-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 1.8rem;
    padding: 0 0.15rem;
    color: var(--deck-text-faint);
    font-size: 0.8rem;
  }

  .deck-header-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
  }

  .deck-select-all {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }

  .deck-count {
    color: var(--deck-text-primary);
  }

  .deck-row {
    width: 100%;
    min-height: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.2rem 0.25rem;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--deck-text-primary);
    text-align: left;
  }

  .deck-row:hover {
    background: var(--deck-row-hover);
  }

  .deck-row.is-active {
    background: var(--deck-selected-surface);
  }

  .deck-row-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex: 1 1 auto;
  }

  .deck-row-icon {
    width: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--deck-text-faint);
  }

  .deck-row-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.78rem;
  }

  .deck-row-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    opacity: 0;
    pointer-events: none;
  }

  .deck-row:hover .deck-row-actions,
  .deck-row:focus-visible .deck-row-actions,
  .deck-row.is-active .deck-row-actions {
    opacity: 1;
    pointer-events: auto;
  }

  .deck-row :global(.form-check-input),
  .deck-select-all :global(.form-check-input) {
    margin: 0;
  }

  .empty-deck {
    padding: 0.75rem 0.25rem;
    color: var(--deck-text-faint);
    font-size: 0.78rem;
    text-align: center;
  }
</style>

