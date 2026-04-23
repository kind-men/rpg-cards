<script lang="ts">
  import { DEFAULT_LAYOUT } from '$lib/defaults';
  import extend from 'just-extend';
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

  let card: Card = $deck[$currentCard];
  let contentEditorMode: 'individual' | 'textfield' = 'individual';
  let textFieldContent = getContentAsString(card?.contents);
  $: isMultiEditing = $multiSelect.size > 1;
  $: cardbackMode = card?.cardback_mode ?? 'icon';
  $: cardbackImages = card?.cardback_images ?? [];
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
      return;
    }

    card = $deck[$currentCard];
    ensureCardbackState(card);
    textFieldContent = getContentAsString(card?.contents);
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
</script>

<div>
  {#if card}
    <Form>
      <section class="editor-section">
        <h3 class="editor-section-title">Card</h3>
        <div class="editor-section-body">
          <!-- Name -->
          <div class="editor-field">
            <Label class="col-form-label" for="name">Name</Label>
            <Input
              type="text"
              name="name"
              id="name"
              bind:value={card.title}
              placeholder={isMultiEditing && card.title === null ? '*' : 'Name'}
            />
          </div>
          <!-- Count -->
          <div class="editor-field">
            <Label class="col-form-label" for="count">Count</Label>
            <Input
              type="number"
              name="count"
              id="count"
              bind:value={card.count}
              placeholder={isMultiEditing && card.count === null ? '*' : 'Count'}
            />
          </div>
          <!-- Color -->
          <div class="editor-field">
            <Label class="col-form-label" for="color-text" disabled>Color</Label>
            <ColorInput bind:value={card.color} idPrefix="color" name="color" />
          </div>
        </div>
      </section>

      <section class="editor-section">
        <div class="editor-section-header">
          <h3 class="editor-section-title">Cardback</h3>
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
        </div>
        <div class="editor-section-body">
          {#if cardbackMode === 'images'}
            <div class="editor-field">
              <Label class="col-form-label" for="cardback-background-color-text">
                Background color
              </Label>
              <ColorInput
                bind:value={card.cardback_background_color}
                idPrefix="cardback-background-color"
                name="cardback-background-color"
              />
            </div>
            <div class="editor-field">
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
            <div class="editor-field">
              <div class="editor-field-inline">
                <Label class="col-form-label" for="cardback-images">Images</Label>
                <Button
                  type="button"
                  color="link"
                  class="editor-inline-button"
                  on:click={handleAddCardbackImage}
                >
                  Add
                </Button>
              </div>

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
            </div>
          {:else}
          <!-- Icon back -->
          <div class="editor-field">
            <Label class="col-form-label" for="icon_back">Icon (Back)</Label>
            <IconInput
              bind:isMultiEditing
              bind:icon={card.icon_back}
              id="icon_back"
              name="icon_back"
              placeholder={isMultiEditing && card.icon_back === null ? '*' : 'Icon back'}
            />
          </div>
          <!-- Text back -->
          <div class="editor-field">
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
          <div class="editor-field">
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
        </div>
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Layout</h3>
        <div class="editor-section-body">
              <!-- Title font size -->
              <div class="editor-field">
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
              <!-- Text font size -->
              <div class="editor-field">
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
              <!-- Custom CSS -->
              {#if !isMultiEditing}
                <div class="editor-field">
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
        </div>
      </section>

      <!-- Contents -->
      <section class="editor-section">
        <div class="editor-section-header">
          <h3 class="editor-section-title">Contents</h3>
          <Button
            type="button"
            color="link"
            class="editor-mode-toggle"
            aria-label="Toggle textfield mode"
            aria-pressed={contentEditorMode === 'textfield'}
            on:click={() =>
              (contentEditorMode =
                contentEditorMode === 'textfield' ? 'individual' : 'textfield')}
          >
            <Icon name="code-slash" />
          </Button>
        </div>
        <div class="editor-section-body">
          {#if !isMultiEditing && card.contents}
            <div class="editor-field">
              {#if contentEditorMode === 'individual'}
                <CardContentEditor bind:contents={card.contents} />
              {:else}
                <div>
                  <Input
                    type="textarea"
                    class="content-editor-textarea"
                    bind:value={textFieldContent}
                  />
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </section>
    </Form>
  {:else}
    <div class="empty-editor">No card is selected!</div>
  {/if}
</div>

<style lang="scss">
  :global(.floating-panel-right form) {
    font-size: var(--editor-form-font-size);
  }

  .editor-section {
    padding: 0.85rem 0 1rem;
    border-bottom: 1px solid rgba(18, 38, 63, 0.08);
  }

  .editor-section:first-child {
    padding-top: 0;
  }

  .editor-section:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .editor-section-title {
    margin: 0;
    color: #223047;
    font-size: var(--section-title-size);
    font-weight: var(--section-title-weight);
    letter-spacing: var(--section-title-spacing);
    text-transform: none;
    padding: 0 0 .75rem 0;
  }

  .editor-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.85rem;
  }

  .editor-section-body {
    display: grid;
    gap: 0.35rem;
  }

  .editor-field {
    display: grid;
    gap: 0.25rem;
  }

  .editor-field-inline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  :global(.floating-panel-right .col-form-label) {
    padding: 0;
    font-size: var(--editor-form-font-size);
    line-height: var(--editor-form-label-line-height);
  }

  :global(.floating-panel-right .form-control),
  :global(.floating-panel-right .input-group-text),
  :global(.floating-panel-right .form-select) {
    font-size: var(--editor-form-font-size);
    border-radius: var(--editor-form-control-radius);
  }

  :global(.floating-panel-right input),
  :global(.floating-panel-right textarea),
  :global(.floating-panel-right select) {
    font-size: var(--editor-form-font-size);
  }

  :global(.floating-panel-right .form-control),
  :global(.floating-panel-right .input-group-text),
  :global(.floating-panel-right .form-select) {
    padding-left: var(--editor-form-control-padding-x);
    padding-right: var(--editor-form-control-padding-x);
    padding-top: var(--editor-form-control-padding-y);
    padding-bottom: var(--editor-form-control-padding-y);
  }

  :global(.floating-panel-right .editor-inline-button) {
    padding: 0;
    color: #5f6d80;
    font-size: 0.7rem;
    text-decoration: none;
  }

  :global(.floating-panel-right .editor-inline-button:hover) {
    color: #223047;
  }

  :global(.floating-panel-right .editor-inline-button-danger:hover) {
    color: #9a3c3c;
  }

  :global(.floating-panel-right .editor-mode-group) {
    gap: 0.25rem;
  }

  :global(.floating-panel-right .editor-mode-toggle) {
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

  :global(.floating-panel-right .editor-mode-toggle:hover) {
    color: #223047;
    background: #efebe2;
  }

  :global(.floating-panel-right .editor-mode-toggle[aria-pressed='true']) {
    color: #223047;
    border-color: rgba(18, 38, 63, 0.2);
    background: #e7e1d2;
  }

  .cardback-image-list {
    display: grid;
    gap: 0.35rem;
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
  :global(.content-editor-textarea) {
    height: 20em;
  }

  .empty-editor {
    display: flex;
    justify-content: center;
  }

  :global(.popover) {
    min-width: fit-content;
  }
</style>
