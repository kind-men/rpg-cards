<script lang="ts">
  import { DEFAULT_LAYOUT } from '$lib/defaults';
  import extend from 'just-extend';
  import {
    Button,
    Form,
    Icon,
    Input,
    InputGroup,
    InputGroupText,
    Label
  } from 'sveltestrap';
  import { createMultiCard, removeEmpty } from '../lib/card-builder';
  import { getContentAsString, parseCardContents } from '../lib/card-json-parser';
  import type Card from '../model/card';
  import { currentCard, deck, multiSelect, recentColors } from '../stores';
  import CardContentEditor from './card-content-editor.svelte';
  import ColorSelecter from './color-selecter.svelte';
  import CssEditor from './css-editor.svelte';
  import IconInput from './game-icon-input.svelte';
  import Hint from './hint.svelte';

  let card: Card = $deck[$currentCard];
  let contentEditorMode: 'individual' | 'textfield' = 'individual';
  let textFieldContent = getContentAsString(card?.contents);
  $: isMultiEditing = $multiSelect.size > 1;

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
  };
  $: $multiSelect, isMultiEditing !== undefined && handleMultiEditingChanging();
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
          <!-- Color -->
          <div class="editor-field">
            <Label class="col-form-label" for="color-text" disabled>Color</Label>
            <InputGroup>
              <InputGroupText>
                <input
                  class="color-input rounded"
                  type="color"
                  name="color"
                  id="color-box"
                  bind:value={card.color}
                  on:change={() => recentColors.add(card.color)}
                />
              </InputGroupText>
              <Input
                type="text"
                name="color"
                id="color-text"
                bind:value={card.color}
                placeholder="Color"
                on:change={() => recentColors.add(card.color)}
              />
              <InputGroupText>
                <ColorSelecter bind:value={card.color} />
              </InputGroupText>
            </InputGroup>
          </div>
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
    font-size: 0.7rem;
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
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: none;
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

  :global(.floating-panel-right .col-form-label) {
    padding: 0;
    font-size: 0.7rem;
    line-height: 1.2;
  }

  :global(.floating-panel-right .form-control),
  :global(.floating-panel-right .input-group-text),
  :global(.floating-panel-right .form-select) {
    font-size: 0.7rem;
    border-radius: 0.1875rem;
  }

  :global(.floating-panel-right input),
  :global(.floating-panel-right textarea),
  :global(.floating-panel-right select) {
    font-size: 0.7rem;
  }

  :global(.floating-panel-right .form-control),
  :global(.floating-panel-right .input-group-text),
  :global(.floating-panel-right .form-select) {
    padding-left: 0.375rem;
    padding-right: 0.375rem;
    padding-top: 0.175rem;
    padding-bottom: 0.175rem;
  }

  :global(.floating-panel-right .editor-mode-toggle) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
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

  .color-input {
    width: 1.5rem;
    height: 1.5rem;
    cursor: pointer;
    overflow: hidden;
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
