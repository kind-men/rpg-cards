<script lang="ts">
  import { getContentTypeDescriptor } from '$lib/card-content-types';
  import { isFlatCardContent, isRowCardContent } from '$lib/card-content';
  import { createEventDispatcher } from 'svelte';
  import { dragHandle } from 'svelte-dnd-action';
  import { Button, ButtonGroup, Icon, Input, InputGroup } from 'sveltestrap';
  import { SPLIT_REGEX } from '../lib/constants';
  import type { CardContent } from '../model/card';
  import ImageUploadInput from './image-upload-input.svelte';
  import MarkdownEditor from './markdown-editor.svelte';

  export let canRemoveColumn = false;
  export let collapsed = true;
  export let columnCount = 0;
  export let content: CardContent;

  const dispatch = createEventDispatcher();
  let splitContent: string[] = [];
  let lastSyncedContentId: string | undefined;
  let lastSyncedSerializedContent = '';

  $: typeDescriptor = getContentTypeDescriptor(content.type);

  const getSplitContentFromValue = (value: string) =>
    value?.split(SPLIT_REGEX) ?? typeDescriptor.params.map(() => '');

  $: if (isFlatCardContent(content)) {
    const serializedContent = content.content ?? '';
    const shouldResync =
      content.id !== lastSyncedContentId || serializedContent !== lastSyncedSerializedContent;

    if (shouldResync) {
      splitContent = getSplitContentFromValue(serializedContent);
      lastSyncedContentId = content.id;
      lastSyncedSerializedContent = serializedContent;
    }
  } else if (splitContent.length !== 0) {
    splitContent = [];
    lastSyncedContentId = content.id;
    lastSyncedSerializedContent = '';
  }

  const updateContent = () => {
    if (!isFlatCardContent(content)) {
      return;
    }

    const nextContent =
      splitContent
        ?.map((c) => {
          if (typeof c !== 'string') {
            c = '' + c;
          }

          return c.replace(/[^\\]\|/, '\\|');
        })
        .join(' | ') ?? '';

    if (content.content === nextContent) {
      return;
    }

    content = {
      ...content,
      content: nextContent
    };
    lastSyncedContentId = content.id;
    lastSyncedSerializedContent = nextContent;
  };

  $: if (isFlatCardContent(content) && splitContent) {
    updateContent();
  }
</script>

<div class="editor-content-card">
  <div class="editor-content-card-header" class:editor-content-card-header-collapsed={collapsed}>
    <div class="editor-content-card-heading">
      <button
        type="button"
        class="editor-content-drag-handle"
        use:dragHandle
        aria-label={`Drag ${typeDescriptor.label ?? typeDescriptor.name} content item`}
      >
        <Icon name="grip-vertical" />
      </button>
      <button
        type="button"
        class="editor-content-card-title"
        aria-expanded={!collapsed}
        on:click={() => dispatch('togglecollapse')}
      >
        <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} />
        <span>{typeDescriptor.label ?? typeDescriptor.name}</span>
        {#if isRowCardContent(content)}
          <span class="editor-content-card-meta">{columnCount} columns</span>
        {/if}
      </button>
    </div>
    <ButtonGroup class="editor-content-actions">
      <Button
        color="link"
        class="link-dark"
        on:click={(e) => {
          e.preventDefault();
          dispatch('duplicate');
        }}
      >
        <Icon name="files" />
      </Button>
      <Button
        color="link"
        class="link-dark"
        on:click={(e) => {
          e.preventDefault();
          dispatch('delete');
        }}
      >
        <Icon name="trash" />
      </Button>
    </ButtonGroup>
  </div>

  {#if !collapsed}
    <div
      class="editor-content-card-body"
      class:editor-content-card-body-text={content.type === 'text'}
    >
      {#if content.type === 'text'}
        <MarkdownEditor bind:value={splitContent[0]} height="280px" />
      {:else if content.type === 'footer'}
        <div class="editor-content-labeled-fields">
          {#each typeDescriptor.params as param, index}
            <div class="editor-content-embedded-input">
              <span class="editor-content-input-icon">
                <Icon name={index === 0 ? 'justify-left' : 'justify-right'} />
              </span>
              <Input
                class="editor-content-input editor-content-input-with-icon"
                type={param.type ?? 'text'}
                bind:value={splitContent[index]}
                placeholder={param.name}
              />
            </div>
          {/each}
        </div>
      {:else if content.type === 'section'}
        <div class="editor-content-labeled-fields">
          {#each typeDescriptor.params as param, index}
            <div class="editor-content-embedded-input">
              <span class="editor-content-input-icon">
                <Icon
                  name={index === 0
                    ? splitContent[1]?.trim()
                      ? 'justify-left'
                      : 'justify'
                    : 'justify-right'}
                />
              </span>
              <Input
                class="editor-content-input editor-content-input-with-icon"
                type={param.type ?? 'text'}
                bind:value={splitContent[index]}
                placeholder={param.name}
              />
            </div>
          {/each}
        </div>
      {:else if content.type === 'dndspellblock'}
        <div class="editor-content-labeled-fields">
          {#each typeDescriptor.params as param, index}
            <div class="editor-content-field-row">
              <span class="editor-content-field-label">{param.name}</span>
              <Input
                class="editor-content-input"
                type={param.type ?? 'text'}
                bind:value={splitContent[index]}
                placeholder={param.name}
              />
            </div>
          {/each}
        </div>
      {:else if content.type === 'picture'}
        <ImageUploadInput
          src={splitContent[0]}
          alt="Picture content preview"
          emptyLabel="No image"
          on:change={(event) => (splitContent[0] = event.detail.src)}
        >
          <Input type="text" bind:value={splitContent[0]} placeholder="URL" />
          <Input
            type="text"
            bind:value={splitContent[1]}
            placeholder="Size (for example 120px, 60%, auto)"
          />
        </ImageUploadInput>
      {:else if content.type === 'row'}
        <div class="editor-row-summary">
          <div class="editor-row-summary-header">
            <div class="editor-row-summary-label">Nested layout</div>
          </div>
          <p class="editor-row-summary-text">
            Columns are stacked below in the sidebar and rendered evenly across the card.
          </p>
          <div class="editor-row-summary-actions">
            <Button
              color="link"
              class="editor-row-action"
              aria-label="Add row column"
              on:click={(e) => {
                  e.preventDefault();
                  dispatch('addcolumn');
                }}
            >
              <Icon name="plus-lg" />
              <span>Add column</span>
            </Button>
            <Button
              color="link"
              class="editor-row-action"
              aria-label="Remove row column"
              disabled={!canRemoveColumn}
              on:click={(e) => {
                  e.preventDefault();
                  dispatch('removecolumn');
                }}
            >
              <Icon name="dash-lg" />
              <span>Remove column</span>
            </Button>
          </div>
        </div>
      {:else}
        <InputGroup class="editor-content-input-group">
          {#if typeDescriptor.params.length === 0}
            <Input disabled />
          {:else}
            {#each typeDescriptor.params as param, index}
              <Input
                class="editor-content-input"
                type={param.type ?? 'text'}
                bind:value={splitContent[index]}
                placeholder={param.name}
              />
            {/each}
          {/if}
        </InputGroup>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .editor-content-card {
    --editor-content-card-border: var(--color-border-soft);
    --editor-content-card-surface: var(--color-surface-base);
    --editor-content-card-shadow: var(--color-shadow-100);
    --editor-content-card-text: var(--color-ink-900);
    --editor-content-card-text-hover: var(--color-ink-925);
    --editor-content-card-text-muted: var(--color-ink-575);
    --editor-content-card-text-subtle: var(--color-ink-450);
    --editor-content-card-label: var(--color-ink-675);
    --editor-content-card-hover-overlay: var(--color-overlay-muted);
    width: 100%;
    display: grid;
    border: 1px solid var(--editor-content-card-border);
    border-radius: var(--bs-border-radius);
    background: var(--editor-content-card-surface);
    overflow: hidden;
    box-shadow: 0 3px 10px var(--editor-content-card-shadow);
  }

  .editor-content-card-header {
    padding: 0.45rem 0.6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom: 1px solid var(--editor-content-card-border);
  }

  .editor-content-card-header-collapsed {
    border-bottom: 0;
  }

  .editor-content-card-heading {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex: 1 1 auto;
  }

  .editor-content-card-title {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.25rem;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--editor-content-card-text);
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: capitalize;
    text-align: left;
  }

  .editor-content-card-title:hover {
    color: var(--editor-content-card-text-hover);
  }

  .editor-content-card-meta {
    margin-left: auto;
    color: var(--editor-content-card-text-muted);
    font-size: 0.68rem;
    font-weight: 500;
    text-transform: none;
  }

  .editor-content-drag-handle {
    width: 1.6rem;
    height: 1.6rem;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: var(--bs-border-radius-sm);
    background: transparent;
    color: var(--editor-content-card-text-subtle);
    cursor: grab;
    flex: 0 0 auto;
  }

  .editor-content-drag-handle:hover {
    background: var(--editor-content-card-hover-overlay);
    color: var(--editor-content-card-text);
  }

  .editor-content-drag-handle:active {
    cursor: grabbing;
  }

  .editor-content-card-body {
    padding: 0.6rem;
  }

  .editor-content-card-body-text {
    padding: 0;
  }

  .editor-content-labeled-fields {
    display: grid;
    gap: 0.5rem;
  }

  .editor-content-field-row {
    display: grid;
    gap: 0.2rem;
  }

  .editor-content-field-label {
    color: var(--editor-content-card-label);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .editor-row-summary {
    display: grid;
    gap: 0.25rem;
  }

  .editor-row-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .editor-row-summary-label {
    color: var(--editor-content-card-label);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .editor-row-summary-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  :global(.editor-row-action.btn) {
    padding: 0.125rem 0.4rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border: 1px solid var(--editor-content-card-border);
    border-radius: 999px;
    color: var(--editor-content-card-text-muted);
    font-size: 0.7rem;
    text-decoration: none;
  }

  :global(.editor-row-action.btn:hover) {
    color: var(--editor-content-card-text);
    background: var(--editor-content-card-hover-overlay);
  }

  :global(.editor-row-action.btn:disabled) {
    opacity: 0.45;
    background: transparent;
    color: var(--editor-content-card-text-subtle);
  }

  .editor-row-summary-text {
    margin: 0;
    color: var(--editor-content-card-text-muted);
    font-size: 0.76rem;
    line-height: 1.45;
  }

  :global(.editor-content-input-group) {
    margin-bottom: 0;
    display: grid;
    gap: 0.35rem;
  }

  :global(.editor-content-inline-input-group) {
    margin-bottom: 0;
  }

  .editor-content-embedded-input {
    position: relative;
  }

  :global(.small-input) {
    max-width: 10em;
  }

  :global(.editor-content-input-group .editor-content-input) {
    width: 100%;
    border-radius: var(--bs-border-radius);
  }

  .editor-content-embedded-input :global(input.form-control) {
    padding-left: 2.1rem;
  }

  .editor-content-input-icon {
    position: absolute;
    top: 50%;
    left: 0.7rem;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: var(--editor-content-card-text-muted);
  }

  :global(input.form-control.editor-content-input-with-icon) {
    padding-left: 2.1rem;
  }

  :global(.input-property-title) {
    max-width: 10em;
  }

  :global(.editor-content-actions .btn) {
    padding: 0.125rem 0.25rem;
    color: var(--editor-content-card-text-muted);
  }

  :global(.editor-content-actions) {
    flex: 0 0 auto;
    align-self: auto;
  }

  :global(.editor-content-actions .btn:last-child) {
    padding: 0 !important;
  }

  :global(.editor-content-actions .btn:hover) {
    color: var(--editor-content-card-text);
  }
</style>
