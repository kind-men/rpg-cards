<script lang="ts">
  import { DEFAULT_LAYOUT } from '$lib/defaults';
  import extend from 'just-extend';
  import {
    Form,
    FormGroup,
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
          <FormGroup row>
            <Label class="col-sm-3 col-form-label" for="name">Name</Label>
            <div class="col">
              <Input
                type="text"
                name="name"
                id="name"
                bind:value={card.title}
                placeholder={isMultiEditing && card.title === null ? '*' : 'Name'}
              />
            </div>
          </FormGroup>
          <!-- Count -->
          <FormGroup row>
            <Label class="col-sm-3 col-form-label" for="count">Count</Label>
            <div class="col">
              <Input
                type="number"
                name="count"
                id="count"
                bind:value={card.count}
                placeholder={isMultiEditing && card.count === null ? '*' : 'Count'}
              />
            </div>
          </FormGroup>
          <!-- Icon back -->
          <FormGroup row>
            <Label class="col-sm-3 col-form-label" for="icon_back">Icon (Back)</Label>
            <div class="col">
              <IconInput
                bind:isMultiEditing
                bind:icon={card.icon_back}
                id="icon_back"
                name="icon_back"
                placeholder={isMultiEditing && card.icon_back === null ? '*' : 'Icon back'}
              />
            </div>
          </FormGroup>
          <!-- Text back -->
          <FormGroup row>
            <Label class="col-sm-3 col-form-label" for="text_back">Text (Back)</Label>
            <div class="col">
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
          </FormGroup>
          <!-- Color -->
          <FormGroup row>
            <Label class="col-sm-3 col-form-label" for="color-text" disabled>Color</Label>
            <div class="col">
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
          </FormGroup>
        </div>
      </section>

      <section class="editor-section">
        <h3 class="editor-section-title">Layout</h3>
        <div class="editor-section-body">
              <!-- Title font size -->
              <FormGroup row>
                <Label class="col-sm-3 col-form-label" for="title-size">Title size</Label>
                <div class="col">
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
              </FormGroup>
              <!-- Text font size -->
              <FormGroup row>
                <Label class="col-sm-3 col-form-label" for="text-font-size">Text font size</Label>
                <div class="col">
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
              </FormGroup>
              <!-- Custom CSS -->
              {#if !isMultiEditing}
                <FormGroup row>
                  <Label class="col-sm-3 col-form-label" for="custom-css">
                    Custom CSS
                    <Hint id="custom-css-hint">
                      <u>Experimental</u> Here you can inject custom CSS (may require
                      <code>!important</code>
                      on some properties)
                    </Hint>
                  </Label>
                  <div class="col">
                    <CssEditor id="custom-css" bind:css={card.layout.custom_css} />
                  </div>
                </FormGroup>
              {/if}
        </div>
      </section>

      <!-- Contents -->
      <section class="editor-section">
        <h3 class="editor-section-title">Contents</h3>
        <div class="editor-section-body">
          <FormGroup row>
            <Label class="col-sm-3 col-form-label" for="content-editor-type">Mode</Label>
            <div class="col">
              <Input
                type="select"
                id="content-editor-type"
                name="content-editor-type"
                bind:value={contentEditorMode}
              >
                <option value="textfield">Textfield mode</option>
                <option value="individual">Individual mode</option>
              </Input>
            </div>
          </FormGroup>
          {#if !isMultiEditing && card.contents}
            <FormGroup row>
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
            </FormGroup>
          {/if}
        </div>
      </section>
    </Form>
  {:else}
    <div class="empty-editor">No card is selected!</div>
  {/if}
</div>

<style lang="scss">
  :global(form) {
    font-size: 0.92rem;
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
    margin: 0 0 0.85rem;
    color: #223047;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: none;
  }

  .editor-section-body {
    display: grid;
    gap: 0.35rem;
  }

  :global(.form-group) {
    margin-bottom: 0.35rem;
  }

  :global(.col-form-label) {
    padding-top: 0.2rem;
    padding-bottom: 0.2rem;
    font-size: 0.78rem;
    line-height: 1.2;
  }

  :global(.form-control),
  :global(.input-group-text),
  :global(.form-select) {
    font-size: 0.86rem;
  }

  :global(.form-control),
  :global(.input-group-text) {
    padding-top: 0.35rem;
    padding-bottom: 0.35rem;
  }

  :global(.row) {
    --bs-gutter-y: 0.15rem;
  }

  .editor-section-body :global(.row.mb-3) {
    margin-bottom: 0.2rem !important;
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
