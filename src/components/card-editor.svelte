<script lang="ts">
  import { base } from '$app/paths';
  import { DEFAULT_LAYOUT } from '$lib/defaults';
  import { CARD_TEMPLATES } from '$lib/card-templates';
  import extend from 'just-extend';
  import { tick } from 'svelte';
  import {
    Button,
    ButtonGroup,
    Form,
    Icon,
    Input,
    Label
  } from 'sveltestrap';
  import { createMultiCard, removeEmpty } from '../lib/card-builder';
  import {
    getContentAsString,
    normalizeCardbackImages,
    parseCards,
    parseCardContents
  } from '../lib/card-json-parser';
  import type Card from '../model/card';
  import type {
    CardBackBorderStyle,
    CardBackImage,
    CardBackImageSizePreset,
    CardBackMode
  } from '../model/card';
  import { currentCard, deck, multiSelect } from '../stores';
  import { settings } from '../stores/settings';
  import CardContentEditor from './card-content-editor.svelte';
  import ColorInput from './color-input.svelte';
  import CssEditor from './css-editor.svelte';
  import IconInput from './game-icon-input.svelte';
  import Hint from './hint.svelte';
  import ImageUploadInput from './image-upload-input.svelte';
  import SidebarSection from './sidebar-section.svelte';
  import TextEditor from './text-editor.svelte';

  let card: Card = $deck[$currentCard];
  let cardIndex = $currentCard;
  let editorPane: 'content' | 'style' = 'content';
  let contentEditorMode: 'individual' | 'textfield' = 'individual';
  let setCollapsedVersion = 0;
  let setCollapsed = true;
  let hasExpandedContentItems = false;
  let isEditingName = false;
  let textFieldContent = getContentAsString(card?.contents);
  let wizardName = '';
  let wizardNameError = '';
  let selectedTemplateId = '';
  let wizardError = '';
  let isApplyingTemplate = false;
  $: isMultiEditing = $multiSelect.size > 1;
  $: cardbackMode = card?.cardback_mode ?? 'icon';
  $: cardbackImages = card?.cardback_images ?? [];
  $: hasTitleContent = card?.contents?.some((content) => content.type === 'cardtitle') ?? false;
  $: isTitleVisible = hasTitleContent || card?.layout?.show_title !== false;
  $: selectedDeckCard = $currentCard > -1 ? $deck[$currentCard] : undefined;
  $: isWizardVisible =
    !isMultiEditing && Boolean(selectedDeckCard) && (selectedDeckCard.contents?.length ?? 0) === 0;
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
    textFieldContent = getContentAsString(card?.contents);
    isEditingName = false;
    wizardName = card?.title ?? '';
    wizardNameError = '';
    selectedTemplateId = '';
    wizardError = '';
    isApplyingTemplate = false;
    setCollapsed = true;
    setCollapsedVersion += 1;
    hasExpandedContentItems = false;
  };

  const updateCardContents = () => {
    try {
      if (!card || contentEditorMode !== 'textfield' || isWizardVisible) {
        return;
      }

      if (!textFieldContent?.trim()) {
        card.contents = [];
        return;
      }

      card.contents = parseCardContents(textFieldContent?.split('\n')) ?? card.contents;
    } catch (error) {}
  };

  $: void textFieldContent, updateCardContents();
  $: {
    $currentCard, $deck, onCurrentCardChanged();
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
  };

  const cloneTemplateCard = (templateCard: Card, title: string): Card => ({
    ...templateCard,
    title,
    tags: [...(templateCard.tags ?? [])],
    contents: (templateCard.contents ?? []).map((content) => ({ ...content })),
    layout: { ...(templateCard.layout ?? {}) },
    cardback_images: (templateCard.cardback_images ?? []).map((image) => ({ ...image }))
  });

  const handleCompleteWizard = async () => {
    const nextTitle = wizardName.trim();

    if (!nextTitle) {
      wizardNameError = 'Please enter a name for your card.';
      return;
    }

    wizardNameError = '';

    if (!card || !selectedTemplateId || cardIndex < 0) {
      return;
    }

    wizardError = '';
    isApplyingTemplate = true;

    try {
      const templateDefinition = CARD_TEMPLATES.find(
        (template) => template.id === selectedTemplateId
      );

      if (!templateDefinition) {
        wizardError = 'Choose a valid starting point before continuing.';
        return;
      }

      const jsonText = await fetch(`${base}${templateDefinition.path}`).then((res) => {
        if (!res.ok) {
          throw new Error(`Template request failed with ${res.status}`);
        }

        return res.text();
      });
      const [templateCard] = parseCards(
        jsonText,
        $settings.convertFirstSubtitle,
        $settings.convertDndSpellblock
      );

      if (!templateCard) {
        wizardError = 'This template did not contain a usable card.';
        return;
      }

      card = cloneTemplateCard(templateCard, nextTitle);
      ensureCardbackState(card);
      deck.setCard(cardIndex, card);
      textFieldContent = getContentAsString(card.contents);
    } catch (error) {
      console.error(error);
      wizardError = 'The selected template could not be loaded.';
    } finally {
      isApplyingTemplate = false;
    }
  };
</script>

<div class="card-editor-content">
  {#if card}
    <Form class="sidebar-form">
      <div class="card-editor-shell">
        {#if isWizardVisible}
          <div class="card-setup-wizard">
            <div class="wizard-hero">
              <img class="wizard-logo" src={`${base}/logo_512.png`} alt="RPG Cards logo" />
              <div class="wizard-copy">
                <h2 class="wizard-title">Create a new card</h2>
                <p class="wizard-text">
                  Give your card a name, then choose whether to begin from a project template or a
                  clean starter card.
                </p>
              </div>
            </div>

            <SidebarSection title="Card setup">
              <div class="sidebar-field">
                <Label class="col-form-label" for="wizard-card-name">Card name</Label>
                <Input
                  id="wizard-card-name"
                  type="text"
                  bind:value={wizardName}
                  invalid={Boolean(wizardNameError)}
                  placeholder="Enter card name"
                  on:input={() => {
                    if (wizardNameError && wizardName.trim()) {
                      wizardNameError = '';
                    }
                  }}
                  on:keydown={(event) => {
                    if (event.key === 'Enter' && selectedTemplateId) {
                      event.preventDefault();
                      void handleCompleteWizard();
                    }
                  }}
                />
                {#if wizardNameError}
                  <div class="wizard-field-error" role="alert">{wizardNameError}</div>
                {/if}
              </div>

              <div class="sidebar-field">
                <div class="wizard-choice-label">Choose how to start</div>
                <div class="wizard-choice-grid" role="radiogroup" aria-label="Card template choice">
                  {#each CARD_TEMPLATES as template}
                    <button
                      type="button"
                      class={`wizard-choice-card ${selectedTemplateId === template.id ? 'wizard-choice-card-active' : ''}`}
                      aria-pressed={selectedTemplateId === template.id}
                      on:click={() => (selectedTemplateId = template.id)}
                    >
                      <span class="wizard-choice-title">{template.label}</span>
                      <span class="wizard-choice-description">{template.description}</span>
                    </button>
                  {/each}
                </div>
              </div>

              {#if wizardError}
                <div class="wizard-error" role="alert">{wizardError}</div>
              {/if}

              <div class="wizard-actions">
                <Button
                  type="button"
                  color="primary"
                  disabled={!selectedTemplateId || isApplyingTemplate}
                  on:click={handleCompleteWizard}
                >
                  {isApplyingTemplate ? 'Preparing...' : 'Continue'}
                </Button>
              </div>
            </SidebarSection>
          </div>
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
                        ? 'Collapse all content items'
                        : 'Expand all content items'}
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
                      <CardContentEditor
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
                <Label class="col-form-label" for="color-text" disabled>Color</Label>
                <ColorInput bind:value={card.color} idPrefix="color" name="color" />
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
                        <CssEditor id="custom-css" bind:css={card.layout.custom_css} />
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
    --card-editor-wizard-surface: #faf8f3;
    --card-editor-wizard-surface-hover: #f6f1e7;
    --card-editor-wizard-surface-active: #efe6d3;
    --card-editor-wizard-hero-glow: rgba(244, 239, 228, 0.95);
    --card-editor-wizard-hero-surface: var(--color-white-98);
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

  .card-setup-wizard {
    display: grid;
    gap: 1rem;
  }

  .wizard-hero {
    padding: 1rem;
    display: grid;
    gap: 0.85rem;
    justify-items: center;
    border: 1px solid var(--card-editor-border-soft);
    border-radius: 1rem;
    background:
      linear-gradient(180deg, var(--card-editor-wizard-hero-glow), var(--card-editor-wizard-hero-surface)),
      var(--card-editor-surface);
    text-align: center;
  }

  .wizard-logo {
    width: 4.75rem;
    height: 4.75rem;
    display: block;
    object-fit: contain;
    filter: drop-shadow(0 8px 18px var(--card-editor-shadow-strong));
  }

  .wizard-copy {
    display: grid;
    gap: 0.35rem;
  }

  .wizard-title {
    margin: 0;
    color: var(--card-editor-text-primary);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .wizard-text {
    margin: 0;
    color: var(--card-editor-text-muted);
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .wizard-choice-label {
    margin-bottom: 0.45rem;
    color: var(--card-editor-text-primary);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .wizard-field-error {
    margin-top: 0.35rem;
    color: var(--card-editor-text-danger);
    font-size: 0.76rem;
    line-height: 1.4;
  }

  .wizard-choice-grid {
    display: grid;
    gap: 0.6rem;
  }

  .wizard-choice-card {
    padding: 0.8rem 0.85rem;
    display: grid;
    gap: 0.25rem;
    text-align: left;
    border: 1px solid var(--card-editor-border-medium);
    border-radius: 0.8rem;
    background: var(--card-editor-wizard-surface);
    color: var(--card-editor-text-primary);
    transition: border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease,
      transform 120ms ease;
  }

  .wizard-choice-card:hover {
    background: var(--card-editor-wizard-surface-hover);
    border-color: var(--card-editor-border-intense);
  }

  .wizard-choice-card-active {
    background: var(--card-editor-wizard-surface-active);
    border-color: var(--card-editor-accent-border);
    box-shadow: 0 0 0 1px var(--card-editor-accent-shadow);
    transform: translateY(-1px);
  }

  .wizard-choice-title {
    font-size: 0.86rem;
    font-weight: 700;
  }

  .wizard-choice-description {
    color: var(--card-editor-text-muted);
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .wizard-error {
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--card-editor-danger-border);
    border-radius: 0.7rem;
    background: var(--card-editor-danger-surface);
    color: var(--card-editor-text-danger);
    font-size: 0.78rem;
  }

  .wizard-actions {
    display: flex;
    justify-content: flex-end;
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

  .card-editor-header {
    display: grid;
  }

  .contents-header-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: auto;
  }

  .sidebar-form-content {
    height: 100%;
    min-height: 0;
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
