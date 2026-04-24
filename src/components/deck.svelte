<script lang="ts">
  import { Button, Icon, Input, InputGroup, InputGroupText, Label, Tooltip } from 'sveltestrap';
  import type Card from '../model/card';
  import type { CardFormat } from '../model/page-layout';
  import { createNewCard } from '../lib/card-builder';
  import { CARD_SIZE_PRESETS, currentCard, deck, multiSelect, pageLayout } from '../stores';
  import ConfirmationDialog from './confirmation-dialog.svelte';
  import { uuid4 } from '$lib/uuid';

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

  const handleClearDeck = () => {
    deck.set([]);
    $multiSelect.clear();
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
      contents: card.contents.map((c) => ({ ...c, id: uuid4() }))
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

  const handleCardFormatSelectChange = (event: Event) => {
    handleCardFormatChange((event.currentTarget as HTMLSelectElement).value as CardFormat);
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
</script>

<ConfirmationDialog let:confirm={confirmThis} danger>
  <div class="deck-wrapper">
    <div class="deck-header">
      <h2 class="deck-title">Deck</h2>
      <div class="deck-toolbar">
        <button class="deck-toolbar-button" type="button" on:click={handleAddCard}>
          <Icon name="plus-lg" />
        </button>
      </div>
    </div>

    <div class="deck-settings">
      <div class="deck-settings-field">
        <Label class="col-form-label" for="card-size-format">Card size</Label>
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
              <span class="deck-row-title">{card.title}</span>
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
                    title: `Delete ${card.title}`,
                    body: `Are you sure you want to delete ${card.title}?`
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
    border-bottom: 1px solid rgba(18, 38, 63, 0.08);
  }

  .deck-title {
    margin: 0;
    color: #223047;
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
    color: #6a7688;
    transition: background-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }

  .deck-toolbar-button:hover,
  .deck-header-action:hover,
  .deck-row-action:hover {
    background: rgba(18, 38, 63, 0.06);
    color: #223047;
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
    gap: 0.1rem;
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
    color: #223047;
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

  .deck-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 1.8rem;
    padding: 0 0.15rem;
    color: #7c8799;
    font-size: 0.8rem;
  }

  .deck-select-all {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }

  .deck-count {
    color: #223047;
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
    color: #223047;
    text-align: left;
  }

  .deck-row:hover {
    background: rgba(18, 38, 63, 0.04);
  }

  .deck-row.is-active {
    background: #eef2f7;
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
    color: #7c8799;
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
    color: #7c8799;
    font-size: 0.78rem;
    text-align: center;
  }
</style>
