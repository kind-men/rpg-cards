<script lang="ts">
  import { DEFAULT_LAYOUT } from '$lib/defaults';
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
  import CardContentEditor from './card-content-editor.svelte';
  import ColorInput from './color-input.svelte';
  import CssEditor from './css-editor.svelte';
  import IconInput from './game-icon-input.svelte';
  import Hint from './hint.svelte';
  import SidebarSection from './sidebar-section.svelte';
  import TextEditor from './text-editor.svelte';

  let card: Card = $deck[$currentCard];
  let editorPane: 'content' | 'style' = 'content';
  let contentEditorMode: 'individual' | 'textfield' = 'individual';
  let setCollapsedVersion = 0;
  let setCollapsed = true;
  let hasExpandedContentItems = false;
  let isEditingName = false;
  let textFieldContent = getContentAsString(card?.contents);
  let nameInput: HTMLInputElement;
  $: isMultiEditing = $multiSelect.size > 1;
  $: cardbackMode = card?.cardback_mode ?? 'icon';
  $: cardbackImages = card?.cardback_images ?? [];
  $: hasTitleContent = card?.contents?.some((content) => content.type === 'cardtitle') ?? false;
  $: isTitleVisible = hasTitleContent || card?.layout?.show_title !== false;
  const cardbackSizeOptions: { value: CardBackImageSizePreset; label: string }[] = [
    { value: 'cover', label: 'Cover' },
    { value: 'contain', label: 'Contain' },
    { value: 'custom', label: 'Custom' }
  ];
  const cardbackBorderOptions: { value: CardBackBorderStyle; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'normal', label: 'Normal' }
  ];

  const getCardbackImageSizePreset = (image: CardBackImage): CardBackImageSizePreset => {
    if (image?.size === 'cover') {
      return 'cover';
    }

    if (image?.size === 'contain' || !image?.size) {
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

    deck.setCard($currentCard, card);

    if (contentEditorMode !== 'textfield') {
      textFieldContent = getContentAsString(card?.contents);
    }
  };

  const onCurrentCardChanged = () => {
    if ($currentCard < 0) {
      card = undefined;
      isEditingName = false;
      return;
    }

    card = $deck[$currentCard];
    ensureCardbackState(card);
    textFieldContent = getContentAsString(card?.contents);
    isEditingName = false;
    setCollapsed = true;
    setCollapsedVersion += 1;
    hasExpandedContentItems = false;
  };

  const updateCardContents = () => {
    try {
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
      return;
    }
    card = $deck[$currentCard];
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

  const handleCardbackImageFileChange = async (index: number, event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const nextImages = [...(card.cardback_images ?? [])];
    nextImages[index] = {
      ...(nextImages[index] ?? { size: 'contain' }),
      src: dataUri
    };
    card.cardback_images = nextImages;

    input.value = '';
  };

  const handleCardbackImageSizePresetChange = (index: number, event: Event) => {
    const preset = (event.currentTarget as HTMLSelectElement).value as CardBackImageSizePreset;
    const nextImages = [...(card.cardback_images ?? [])];
    const nextImage = { ...(nextImages[index] ?? { src: '' }) };
    nextImage.size = preset === 'custom' ? nextImage.size || 'contain' : preset;
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
      nameInput?.focus();
      nameInput?.select();
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
</script>

<div class="card-editor-content">
  {#if card}
    <Form class="sidebar-form">
      <div class="card-editor-shell">
        <div class="card-editor-header-shell">
          <div class="card-editor-header">
            <div class="sidebar-field">
              <div class="name-field-row">
                {#if isEditingName}
                  <Input
                    bind:this={nameInput}
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
                        <div class="cardback-image-row">
                          <div class="cardback-image-preview">
                            {#if image.src}
                              <img src={image.src} alt={`Cardback image ${index + 1}`} />
                            {:else}
                              <span>Empty</span>
                            {/if}
                          </div>
                          <div class="cardback-image-actions">
                            <Input
                              type="file"
                              accept="image/*"
                              on:change={(event) => handleCardbackImageFileChange(index, event)}
                            />
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
                          </div>
                        </div>
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
      </div>
    </Form>
  {:else}
    <div class="empty-editor">No card is selected!</div>
  {/if}
</div>

<style lang="scss">
  .card-editor-content {
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
    color: #5f6d80;
    font-size: 0.7rem;
    text-decoration: none;
  }

  .card-editor-content :global(.editor-inline-button:hover) {
    color: #223047;
  }

  .card-editor-content :global(.editor-inline-button-danger:hover) {
    color: #9a3c3c;
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
    color: #6a7688;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }

  .card-editor-content :global(.editor-icon-button:hover) {
    background: rgba(18, 38, 63, 0.06);
    color: #223047;
  }

  .card-editor-content :global(.editor-icon-button:disabled) {
    opacity: 0.45;
    cursor: default;
    background: transparent;
    color: #6a7688;
  }

  .card-editor-content :global(.editor-mode-toggle) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.125rem 0.25rem;
    font-size: 0.8rem;
    color: #5f6d80;
    text-decoration: none;
    border: 1px solid rgba(18, 38, 63, 0.12);
    border-radius: 0.1875rem;
    background: #f6f4ef;
  }

  .card-editor-content :global(.editor-mode-toggle:hover) {
    color: #223047;
    background: #efebe2;
  }

  .card-editor-content :global(.editor-mode-toggle[aria-pressed='true']) {
    color: #223047;
    border-color: rgba(18, 38, 63, 0.2);
    background: #e7e1d2;
  }

  .card-editor-content :global(.editor-mode-toggle-active) {
    color: #223047;
    border-color: rgba(18, 38, 63, 0.2);
    background: #e7e1d2;
    box-shadow: inset 0 1px 2px rgba(18, 38, 63, 0.08);
  }

  .editor-pane-switch {
    margin: 0 0 0.9rem;
    padding: 0.25rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem;
    border: 1px solid rgba(18, 38, 63, 0.08);
    border-radius: 999px;
    background: #efebe2;
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
    color: #6a7688;
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
  }

  .card-editor-content :global(.editor-pane-toggle:hover) {
    color: #223047;
    background: rgba(255, 255, 255, 0.45);
  }

  .card-editor-content :global(.editor-pane-toggle.editor-pane-toggle-active) {
    color: #223047;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(18, 38, 63, 0.08);
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
    background: #ffffff;
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
    border: 1px dashed rgba(18, 38, 63, 0.12);
    border-radius: 0.1875rem;
    color: #7c8799;
  }

  .cardback-image-row {
    display: grid;
    grid-template-columns: 4.25rem minmax(0, 1fr);
    align-items: start;
    gap: 0.5rem;
    padding: 0.35rem;
    border: 1px solid rgba(18, 38, 63, 0.08);
    border-radius: 0.25rem;
    background: #fbfaf7;
  }

  .cardback-image-preview {
    width: 4.25rem;
    height: 4.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(18, 38, 63, 0.08);
    border-radius: 0.1875rem;
    background: #ffffff;
    color: #a3acba;
  }

  .cardback-image-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .cardback-image-actions {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
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
    color: #223047;
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
    border: 1px solid rgba(18, 38, 63, 0.12);
    border-radius: var(--bs-border-radius);
    box-shadow: inset 0 1px 2px rgba(18, 38, 63, 0.04);
  }

  :global(.content-editor-textarea .cm-editor.cm-focused) {
    background: #ffffff;
  }

  .empty-editor {
    display: flex;
    justify-content: center;
  }

  :global(.popover) {
    min-width: fit-content;
  }
</style>
