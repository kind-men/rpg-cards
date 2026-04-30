<script lang="ts">
  import { DEFAULT_LAYOUT } from '$lib/defaults';
  import { isContainerContent } from '$lib/card-content';
  import extend from 'just-extend';
  import { tick } from 'svelte';
  import {
    Button,
    ButtonGroup,
    Form,
    Icon,
    Input,
    Label
  } from '@sveltestrap/sveltestrap';
  import { createMultiCard, removeEmpty } from '$lib/card-builder';
  import {
    CardContentError,
    getContentAsString,
    normalizeCardbackImages,
    parseCardContents
  } from '$lib/card-json-parser';
  import type Card from '$model/card';
  import type {
    CardBackBorderStyle,
    CardBackImage,
    CardBackImageSizePreset,
    CardBackMode
  } from '$model/card';
  import { currentCard, deck, multiSelect } from '../../stores';
  import CardContentBlocksEditor from './card-content-blocks-editor.svelte';
  import CardSetupWizard from './card-setup-wizard.svelte';
  import ColorInput from '../form/color.svelte';
  import CssEditor from '../form/code-editor/css.svelte';
  import IconInput from '../form/game-icon.svelte';
  import Hint from '../hint.svelte';
  import ImageUploadInput from '../form/image-upload.svelte';
  import SidebarSection from '../sidebar-section.svelte';
  import TextEditor from '../form/code-editor/text.svelte';

  let card: Card = $deck[$currentCard];
  let cardIndex = $currentCard;
  let editorPane: 'content' | 'style' = 'content';
  let contentEditorMode: 'individual' | 'textfield' = 'individual';
  let setCollapsedVersion = 0;
  let setCollapsed = true;
  let hasExpandedContentItems = false;
  let isEditingName = false;
  let rawContentError = '';
  let textFieldContent = getContentAsString(card?.contents);
  let lastLoadedCurrentCard = $currentCard;
  let lastLoadedDeckCard = $currentCard > -1 ? $deck[$currentCard] : undefined;
  $: isMultiEditing = $multiSelect.size > 1;
  $: cardbackMode = card?.cardback_mode ?? 'icon';
  $: cardbackImages = card?.cardback_images ?? [];
  $: hasTitleContent =
    card?.contents?.some((content) => !isContainerContent(content) && content.type === 'cardtitle') ?? false;
  $: isTitleVisible = hasTitleContent || card?.layout?.show_title !== false;
  $: selectedDeckCard = $currentCard > -1 ? $deck[$currentCard] : undefined;
  $: isWizardVisible =
    !isMultiEditing &&
    Boolean(selectedDeckCard) &&
    !selectedDeckCard.title?.trim() &&
    (selectedDeckCard.contents?.length ?? 0) === 0;
  const cardbackSizeOptions: { value: CardBackImageSizePreset; label: string }[] = [
    { value: 'cover', label: 'Cover' },
    { value: 'contain', label: 'Contain' },
    { value: 'custom', label: 'Custom' }
  ];
  const cardbackBorderOptions: { value: CardBackBorderStyle; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'normal', label: 'Normal' }
  ];
  const isPresetSize = (size?: string) => size === 'cover' || size === 'contain';

  const getCardbackImageSizePreset = (image: CardBackImage): CardBackImageSizePreset => {
    if (image?.size === 'cover') {
      return 'cover';
    }

    if (image?.size === 'contain') {
      return 'contain';
    }

    return 'custom';
  };

  const ensureCardbackState = (target: Partial<Card>) => {
    if (!target || target.cardback_mode === null) {
      return;
    }

    if (!target.cardback_mode) {
      target.cardback_mode = 'icon';
    }

    target.cardback_images = normalizeCardbackImages(target.cardback_images);

    if (!target.cardback_background_color) {
      target.cardback_background_color = '#ffffff';
    }

    if (!target.cardback_border_style) {
      target.cardback_border_style = 'normal';
    }
  };

  const updateDeck = () => {
    if (isMultiEditing) {
      const multi = removeEmpty(card);

      deck.set(
        $deck.map((c, index) => {
          if ($multiSelect.has(index)) {
            return extend(true, c, multi) as Card;
          }
          return c;
        })
      );
      return;
    }

    if (cardIndex < 0) {
      return;
    }

    deck.setCard(cardIndex, card);

    if (contentEditorMode !== 'textfield') {
      textFieldContent = getContentAsString(card?.contents);
    }
  };

  const onCurrentCardChanged = () => {
    if ($currentCard < 0) {
      card = undefined;
      cardIndex = $currentCard;
      isEditingName = false;
      return;
    }

    card = $deck[$currentCard];
    cardIndex = $currentCard;
    ensureCardbackState(card);
    rawContentError = '';
    textFieldContent = getContentAsString(card?.contents);
    isEditingName = false;
    setCollapsed = true;
    setCollapsedVersion += 1;
    hasExpandedContentItems = false;
  };

  const updateCardContents = () => {
    try {
      if (!card || contentEditorMode !== 'textfield' || isWizardVisible) {
        rawContentError = '';
        return;
      }

      if (!textFieldContent?.trim()) {
        card.contents = [];
        rawContentError = '';
        return;
      }

      card.contents = parseCardContents(textFieldContent?.split('\n')) ?? card.contents;
      rawContentError = '';
    } catch (error) {
      rawContentError =
        error instanceof CardContentError || error instanceof Error
          ? error.message
          : 'The content format is invalid.';
    }
  };

  $: void textFieldContent, updateCardContents();
  $: {
    const nextSelectedDeckCard = $currentCard > -1 ? $deck[$currentCard] : undefined;
    const shouldReloadSelectedCard =
      !isMultiEditing &&
      ($currentCard !== lastLoadedCurrentCard || nextSelectedDeckCard !== lastLoadedDeckCard);

    if (shouldReloadSelectedCard) {
      lastLoadedCurrentCard = $currentCard;
      lastLoadedDeckCard = nextSelectedDeckCard;
      onCurrentCardChanged();
    }
  }
  $: card && updateDeck();

  const handleMultiEditingChanging = () => {
    if (isMultiEditing) {
      card = createMultiCard($deck.filter((_, index) => $multiSelect.has(index))) as Card;
      cardIndex = -1;
      return;
    }
    card = $deck[$currentCard];
    cardIndex = $currentCard;
    lastLoadedCurrentCard = $currentCard;
    lastLoadedDeckCard = card;
    ensureCardbackState(card);
  };
  $: $multiSelect, isMultiEditing !== undefined && handleMultiEditingChanging();

  const setCardbackMode = (mode: CardBackMode) => {
    card.cardback_mode = mode;
    card.cardback_images = card.cardback_images ?? [];
  };

  const handleAddCardbackImage = () => {
    card.cardback_images = [
      ...(card.cardback_images ?? []),
      {
        src: '',
        size: 'contain'
      }
    ];
  };

  const handleRemoveCardbackImage = (index: number) => {
    const nextImages = [...(card.cardback_images ?? [])];
    nextImages.splice(index, 1);
    card.cardback_images = nextImages;
  };

  const handleCardbackImageChange = (index: number, src: string) => {
      const nextImages = [...(card.cardback_images ?? [])];
      nextImages[index] = {
        ...(nextImages[index] ?? { size: 'contain' }),
        src
      };
      card.cardback_images = nextImages;
    };

  const handleCardbackImageSizePresetChange = (index: number, event: Event) => {
    const preset = (event.currentTarget as HTMLSelectElement).value as CardBackImageSizePreset;
    const nextImages = [...(card.cardback_images ?? [])];
    const nextImage = { ...(nextImages[index] ?? { src: '' }) };
    if (preset === 'custom') {
      nextImage.size = isPresetSize(nextImage.size) ? '' : nextImage.size || '';
    } else {
      nextImage.size = preset;
    }
    nextImages[index] = nextImage;
    card.cardback_images = nextImages;
  };

  const handleCardbackImageCustomSizeChange = (index: number, event: Event) => {
    const value = (event.currentTarget as HTMLInputElement).value;
    const nextImages = [...(card.cardback_images ?? [])];
    nextImages[index] = {
      ...(nextImages[index] ?? { src: '' }),
      size: value
    };
    card.cardback_images = nextImages;
  };

  const toggleTitleVisibility = () => {
    if (hasTitleContent) {
      return;
    }

    card.layout.show_title = card.layout.show_title === false;
  };

  const startEditingName = async () => {
    if (!isEditingName) {
      isEditingName = true;
      await tick();
      const input = document.getElementById('name');
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
      return;
    }

    stopEditingName();
  };

  const stopEditingName = () => {
    isEditingName = false;
  };

  const toggleAllContentItems = () => {
    setCollapsed = hasExpandedContentItems;
    setCollapsedVersion += 1;
  };

  const toggleContentEditorMode = () => {
    contentEditorMode = contentEditorMode === 'textfield' ? 'individual' : 'textfield';
    setCollapsed = true;
    setCollapsedVersion += 1;
    hasExpandedContentItems = false;
    rawContentError = '';
  };

  const handleWizardComplete = (event: CustomEvent<{ card: Card; textFieldContent: string }>) => {
    if (cardIndex < 0) {
      return;
    }

    card = event.detail.card;
    ensureCardbackState(card);
    deck.setCard(cardIndex, card);
    rawContentError = '';
    textFieldContent = event.detail.textFieldContent;
  };
</script>

<div class="card-editor-content">
  {#if card}
    <Form class="sidebar-form">
      <div class="card-editor-shell">
        {#if isWizardVisible}
          {#key cardIndex}
            <CardSetupWizard initialName={card?.title ?? ''} on:complete={handleWizardComplete} />
          {/key}
        {:else}
          <div class="card-editor-header-shell">
            <div class="card-editor-header">
              <div class="sidebar-field">
                <div class="name-field-row">
                  {#if isEditingName}
                    <Input
                      type="text"
                      name="name"
                      id="name"
                      bind:value={card.title}
                      placeholder={isMultiEditing && card.title === null ? '*' : 'Name'}
                      on:blur={stopEditingName}
                      on:keydown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          stopEditingName();
                        }
                      }}
                    />
                  {:else}
                    <div class="name-display" id="name">
                      {card.title || (isMultiEditing && card.title === null ? '*' : 'Untitled card')}
                    </div>
                  {/if}

                  <Button
                    type="button"
                    color="link"
                    class="editor-icon-button"
                    aria-label={isEditingName ? 'Finish editing card name' : 'Edit card name'}
                    on:click={startEditingName}
                  >
                    <Icon name={isEditingName ? 'check-lg' : 'pencil'} />
                  </Button>
                  <Button
                    type="button"
                    color="link"
                    class="editor-icon-button"
                    aria-label={hasTitleContent
                      ? 'Title visibility is controlled by a title content block'
                      : isTitleVisible
                        ? 'Hide title on card'
                        : 'Show title on card'}
                    aria-pressed={isTitleVisible}
                    disabled={hasTitleContent}
                    on:click={toggleTitleVisibility}
                  >
                    <Icon name={isTitleVisible ? 'eye' : 'eye-slash'} />
                  </Button>
                </div>
              </div>
            </div>

            <div class="editor-pane-switch" role="tablist" aria-label="Card editor mode">
              <Button
                type="button"
                color="link"
                class={`editor-pane-toggle ${editorPane === 'content' ? 'editor-pane-toggle-active' : ''}`}
                role="tab"
                aria-selected={editorPane === 'content'}
                on:click={() => (editorPane = 'content')}
              >
                Content
              </Button>
              <Button
                type="button"
                color="link"
                class={`editor-pane-toggle ${editorPane === 'style' ? 'editor-pane-toggle-active' : ''}`}
                role="tab"
                aria-selected={editorPane === 'style'}
                on:click={() => (editorPane = 'style')}
              >
                Style
              </Button>
            </div>
          </div>

          <div class="card-editor-sections-scroll">
            {#if editorPane === 'content'}
              <SidebarSection grow={contentEditorMode === 'textfield'}>
                <svelte:fragment slot="header">
                  <h2 class="sidebar-section-title">Contents</h2>
                  <div class="contents-header-actions">
                    <Button
                      type="button"
                      color="link"
                      class="editor-icon-button"
                      aria-label={hasExpandedContentItems
                        ? 'Collapse all content blocks'
                        : 'Expand all content blocks'}
                      on:click={toggleAllContentItems}
                    >
                      <Icon name={hasExpandedContentItems ? 'arrows-collapse' : 'arrows-expand'} />
                    </Button>
                    <Button
                      type="button"
                      color="link"
                      class={`editor-icon-button ${contentEditorMode === 'textfield' ? 'editor-mode-toggle editor-mode-toggle-active' : ''}`}
                      aria-label="Toggle textfield mode"
                      aria-pressed={contentEditorMode === 'textfield'}
                      on:click={toggleContentEditorMode}
                    >
                      <Icon name="code-slash" />
                    </Button>
                  </div>
                </svelte:fragment>
                {#if !isMultiEditing && card.contents}
                  <div class="sidebar-field" class:sidebar-field-grow={contentEditorMode === 'textfield'}>
                    {#if contentEditorMode === 'individual'}
                  <CardContentBlocksEditor
                        bind:contents={card.contents}
                        {setCollapsedVersion}
                        {setCollapsed}
                        on:collapsechange={(event) =>
                          (hasExpandedContentItems = event.detail.hasExpandedItems)}
                      />
                    {:else}
                      <div class="raw-content-editor">
                        <TextEditor
                          id="content-editor-raw"
                          class="content-editor-textarea"
                          bind:value={textFieldContent}
                        />
                      </div>
                      {#if rawContentError}
                        <div class="raw-content-error" role="alert">{rawContentError}</div>
                      {/if}
                    {/if}
                  </div>
                {/if}
              </SidebarSection>
            {:else}
              <SidebarSection title="Card Style">
              <div class="layout-size-fields">
                <div class="sidebar-field">
                  <Label class="col-form-label" for="title-size">Title size</Label>
                  <Input
                    type="text"
                    name="title-size"
                    id="title-size"
                    bind:value={card.layout.title_font_size}
                    placeholder={isMultiEditing && card.layout.title_font_size === null
                      ? '*'
                      : DEFAULT_LAYOUT.TITLE_FONT_SIZE}
                  />
                </div>
                <div class="sidebar-field">
                  <Label class="col-form-label" for="text-font-size">Text font size</Label>
                  <Input
                    type="text"
                    name="text-font-size"
                    id="text-font-size"
                    bind:value={card.layout.text_font_size}
                    placeholder={isMultiEditing && card.layout.text_font_size === null
                      ? '*'
                      : DEFAULT_LAYOUT.TEXT_FONT_SIZE}
                  />
                </div>
              </div>
              <div class="sidebar-field">
                <Label class="col-form-label" for="color-text">Color</Label>
                <ColorInput bind:value={card.color} idPrefix="color" name="color" />
              </div>
              <div class="sidebar-field">
                <label class="style-toggle-row" for="pair-continuations">
                  <Input
                    id="pair-continuations"
                    class="style-toggle-switch"
                    type="switch"
                    bind:checked={card.layout.pair_continuations}
                  />
                  <span class="style-toggle-copy">
                    <span class="style-toggle-label">Pair continuation cards</span>
                    <Hint id="pair-continuations-hint">
                      Overflow continuation cards are paired two at a time and stay connected along
                      the long edge in preview and print so they can be folded together.
                    </Hint>
                  </span>
                </label>
              </div>
            </SidebarSection>

            <SidebarSection>
              <svelte:fragment slot="header">
                <h2 class="sidebar-section-title">Cardback</h2>
                <ButtonGroup class="editor-mode-group" aria-label="Cardback style">
                  <Button
                    type="button"
                    color="link"
                    class="editor-mode-toggle"
                    aria-label="Use icon and color cardback"
                    aria-pressed={cardbackMode === 'icon'}
                    on:click={() => setCardbackMode('icon')}
                  >
                    <Icon name="bookmark-star" />
                  </Button>
                  <Button
                    type="button"
                    color="link"
                    class="editor-mode-toggle"
                    aria-label="Use image cardback"
                    aria-pressed={cardbackMode === 'images'}
                    on:click={() => setCardbackMode('images')}
                  >
                    <Icon name="image" />
                  </Button>
                </ButtonGroup>
              </svelte:fragment>
                {#if cardbackMode === 'images'}
                  <div class="sidebar-field">
                    <Label class="col-form-label" for="cardback-background-color-text">
                      Background color
                    </Label>
                    <ColorInput
                      bind:value={card.cardback_background_color}
                      idPrefix="cardback-background-color"
                      name="cardback-background-color"
                    />
                  </div>
                  <div class="sidebar-field">
                    <Label class="col-form-label" for="cardback-border-style">Border</Label>
                    <Input
                      id="cardback-border-style"
                      type="select"
                      bind:value={card.cardback_border_style}
                    >
                      {#each cardbackBorderOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </Input>
                  </div>
                  <SidebarSection class="cardback-images-section">
                    <svelte:fragment slot="header">
                      <h3 class="sidebar-section-title">Images</h3>
                      <Button
                        type="button"
                        color="link"
                        class="editor-icon-button"
                        aria-label="Add cardback image"
                        on:click={handleAddCardbackImage}
                      >
                        <Icon name="plus-lg" />
                      </Button>
                    </svelte:fragment>

                    <div class="cardback-image-list" id="cardback-images">
                      {#if cardbackImages.length === 0}
                        <div class="cardback-image-empty">No images added yet.</div>
                      {/if}

                      {#each cardbackImages as image, index}
                        <ImageUploadInput
                          src={image.src}
                          alt={`Cardback image ${index + 1}`}
                          on:change={(event) => handleCardbackImageChange(index, event.detail.src)}
                        >
                            <Input
                              type="select"
                              value={getCardbackImageSizePreset(image)}
                              on:change={(event) => handleCardbackImageSizePresetChange(index, event)}
                            >
                              {#each cardbackSizeOptions as option}
                                <option value={option.value}>{option.label}</option>
                              {/each}
                            </Input>
                            {#if getCardbackImageSizePreset(image) === 'custom'}
                              <Input
                                type="text"
                                value={image.size}
                                placeholder="Background size"
                                on:input={(event) => handleCardbackImageCustomSizeChange(index, event)}
                              />
                            {/if}
                            <Button
                              type="button"
                              color="link"
                              class="editor-inline-button editor-inline-button-danger"
                              on:click={() => handleRemoveCardbackImage(index)}
                            >
                              Remove
                            </Button>
                        </ImageUploadInput>
                      {/each}
                    </div>
                  </SidebarSection>
                {:else}
                <div class="sidebar-field">
                  <Label class="col-form-label" for="icon_back">Icon (Back)</Label>
                  <IconInput
                    bind:isMultiEditing
                    bind:icon={card.icon_back}
                    id="icon_back"
                    name="icon_back"
                    placeholder={isMultiEditing && card.icon_back === null ? '*' : 'Icon back'}
                  />
                </div>
                <div class="sidebar-field">
                  <Label class="col-form-label" for="text_back">Text (Back)</Label>
                  <Input
                    type="text"
                    name="text_back"
                    id="text_back"
                    bind:value={card.text_back}
                    placeholder={isMultiEditing && card.text_back === null
                      ? '*'
                      : 'Text to show on back, such as spell lvl'}
                  />
                </div>
                <div class="sidebar-field">
                  <Label class="col-form-label" for="cardback-border-style">Border</Label>
                  <Input
                    id="cardback-border-style"
                    type="select"
                    bind:value={card.cardback_border_style}
                  >
                    {#each cardbackBorderOptions as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </Input>
                </div>
                {/if}
            </SidebarSection>

            <SidebarSection title="Layout">
                    {#if !isMultiEditing}
                      <div class="sidebar-field">
                        <Label class="col-form-label" for="custom-css">
                          Custom CSS
                          <Hint id="custom-css-hint">
                            <u>Experimental</u> Here you can inject custom CSS (may require
                            <code>!important</code>
                            on some properties)
                          </Hint>
                        </Label>
                        <CssEditor id="custom-css" bind:value={card.layout.custom_css} />
                      </div>
                    {/if}
            </SidebarSection>
            {/if}
          </div>
        {/if}
      </div>
    </Form>
  {:else}
    <div class="empty-editor">No card is selected!</div>
  {/if}
</div>

<style lang="scss">
  .card-editor-content {
    --card-editor-text-primary: var(--color-ink-900);
    --card-editor-text-muted: var(--color-ink-575);
    --card-editor-text-subtle: var(--color-ink-550);
    --card-editor-text-faint: var(--color-ink-500);
    --card-editor-text-danger: var(--color-danger);
    --card-editor-text-danger-strong: var(--color-danger-strong);
    --card-editor-border-soft: var(--color-border-soft);
    --card-editor-border-medium: var(--color-border-medium);
    --card-editor-border-intense: var(--color-border-intense);
    --card-editor-border-active: var(--color-border-active);
    --card-editor-surface: var(--color-surface-base);
    --card-editor-surface-panel: var(--color-surface-panel);
    --card-editor-surface-panel-strong: var(--color-surface-panel-strong);
    --card-editor-surface-panel-active: var(--color-surface-panel-active);
    --card-editor-surface-overlay: var(--color-white-45);
    --card-editor-hover-overlay: var(--color-overlay-muted);
    --card-editor-shadow-soft: var(--color-shadow-200);
    --card-editor-shadow-strong: var(--color-shadow-300);
    --card-editor-danger-border: var(--color-danger-border);
    --card-editor-danger-surface: var(--color-danger-surface);
    --card-editor-accent-border: var(--color-accent-border);
    --card-editor-accent-shadow: var(--color-accent-shadow);
    height: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .card-editor-content :global(form.sidebar-form) {
    height: 100%;
    min-height: 0;
    display: block;
  }

  .card-editor-content :global(.editor-inline-button) {
    padding: 0;
    color: var(--card-editor-text-muted);
    font-size: 0.7rem;
    text-decoration: none;
  }

  .card-editor-content :global(.editor-inline-button:hover) {
    color: var(--card-editor-text-primary);
  }

  .card-editor-content :global(.editor-inline-button-danger:hover) {
    color: var(--card-editor-text-danger-strong);
  }

  .card-editor-content :global(.editor-icon-button) {
    width: 1.7rem;
    height: 1.7rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--card-editor-text-subtle);
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }

  .card-editor-content :global(.editor-icon-button:hover) {
    background: var(--card-editor-hover-overlay);
    color: var(--card-editor-text-primary);
  }

  .card-editor-content :global(.editor-icon-button:disabled) {
    opacity: 0.45;
    cursor: default;
    background: transparent;
    color: var(--card-editor-text-subtle);
  }

  .card-editor-content :global(.editor-mode-toggle) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.125rem 0.25rem;
    font-size: 0.8rem;
    color: var(--card-editor-text-muted);
    text-decoration: none;
    border: 1px solid var(--card-editor-border-medium);
    border-radius: 0.1875rem;
    background: var(--card-editor-surface-panel);
  }

  .card-editor-content :global(.editor-mode-toggle:hover) {
    color: var(--card-editor-text-primary);
    background: var(--card-editor-surface-panel-strong);
  }

  .card-editor-content :global(.editor-mode-toggle[aria-pressed='true']) {
    color: var(--card-editor-text-primary);
    border-color: var(--card-editor-border-active);
    background: var(--card-editor-surface-panel-active);
  }

  .card-editor-content :global(.editor-mode-toggle-active) {
    color: var(--card-editor-text-primary);
    border-color: var(--card-editor-border-active);
    background: var(--card-editor-surface-panel-active);
    box-shadow: inset 0 1px 2px var(--card-editor-shadow-soft);
  }

  .editor-pane-switch {
    margin: 0 0 0.9rem;
    padding: 0.25rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem;
    border: 1px solid var(--card-editor-border-soft);
    border-radius: 999px;
    background: var(--card-editor-surface-panel-strong);
  }

  .card-editor-content :global(.editor-pane-toggle) {
    min-height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 0.85rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--card-editor-text-subtle);
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
  }

  .card-editor-content :global(.editor-pane-toggle:hover) {
    color: var(--card-editor-text-primary);
    background: var(--card-editor-surface-overlay);
  }

  .card-editor-content :global(.editor-pane-toggle.editor-pane-toggle-active) {
    color: var(--card-editor-text-primary);
    background: var(--card-editor-surface);
    box-shadow: 0 1px 4px var(--card-editor-shadow-soft);
  }

  .cardback-image-list {
    display: grid;
    gap: 0.35rem;
  }

  .card-editor-header-shell {
    flex: 0 0 auto;
    margin: 0 0 0.9rem;
    display: grid;
    gap: 0.5rem;
    background: var(--card-editor-surface);
  }

  .card-editor-shell {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }

  :global(.cardback-images-section.sidebar-section) {
    padding: 0;
    border-bottom: 0;
  }

  .cardback-image-empty {
    padding: 0.45rem 0.55rem;
    border: 1px dashed var(--card-editor-border-medium);
    border-radius: 0.1875rem;
    color: var(--card-editor-text-faint);
  }

  .layout-size-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }

  .style-toggle-row {
    min-height: 2.25rem;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    cursor: pointer;
  }

  .style-toggle-copy {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--card-editor-text-primary);
    line-height: 1.35;
  }

  .style-toggle-label {
    font-size: 0.9rem;
  }

  .card-editor-content :global(.style-toggle-switch.form-switch) {
    margin: 0;
    padding: 0 0 0 0.25em;
    flex: none;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    align-self: center;
  }

  .card-editor-content :global(.style-toggle-switch.form-switch .form-check-input) {
    margin: 0;
    float: none;
    cursor: pointer;
    align-self: center;
    transform: scale(1.25);
    transform-origin: center;
  }

  .card-editor-header {
    display: grid;
  }

  .contents-header-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: auto;
  }

  .card-editor-sections-scroll {
    min-height: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    overflow-y: auto;
    padding-right: 0.1rem;
  }

  .name-field-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 0.5rem;
    align-items: center;
  }

  .name-display {
    min-height: calc(1.5em + var(--editor-form-control-padding-y) * 2 + 2px);
    padding: 0;
    display: flex;
    align-items: center;
    color: var(--card-editor-text-primary);
    font-size: 1.25rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name-field-row :global(#name.form-control) {
    font-size: 1.25rem;
    font-weight: 500;
  }

  .raw-content-editor {
    min-height: 0;
    display: flex;
    flex: 1 1 auto;
  }

  .sidebar-field-grow {
    min-height: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }

  .raw-content-error {
    margin-top: 0.5rem;
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--card-editor-danger-border);
    border-radius: 0.4rem;
    background: var(--card-editor-danger-surface);
    color: var(--card-editor-text-danger);
    font-size: 0.76rem;
    line-height: 1.45;
  }

  @media (max-width: 520px) {
    .layout-size-fields {
      grid-template-columns: 1fr;
    }
  }

  :global(.content-editor-textarea) {
    min-height: 100%;
    height: 100%;
    flex: 1 1 auto;
    border: 1px solid var(--card-editor-border-medium);
    border-radius: var(--bs-border-radius);
    box-shadow: inset 0 1px 2px var(--color-shadow-50);
  }

  :global(.content-editor-textarea .cm-editor.cm-focused) {
    background: var(--card-editor-surface);
  }

  .empty-editor {
    display: flex;
    justify-content: center;
  }

  :global(.popover) {
    min-width: fit-content;
  }
</style>

