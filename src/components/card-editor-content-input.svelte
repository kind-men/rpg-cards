<script lang="ts">
  import { getContentTypeDescriptor } from '$lib/card-content-types';
  import { createEventDispatcher } from 'svelte';
  import { dragHandle } from 'svelte-dnd-action';
  import {
    Button,
    ButtonGroup,
    Icon,
    Input,
    InputGroup
  } from 'sveltestrap';
  import { SPLIT_REGEX } from '../lib/constants';
  import type { CardContent } from '../model/card';
  import ImageUploadInput from './image-upload-input.svelte';
  import MarkdownEditor from './markdown-editor.svelte';

  export let content: CardContent;
  export let collapsed = true;
  $: typeDescriptor = getContentTypeDescriptor(content.type);

  let splitContent = content.content?.split(SPLIT_REGEX) ?? typeDescriptor.params.map(() => '');

  const dispatch = createEventDispatcher();

  const updateContent = () => {
    content.content =
      splitContent
        ?.map((c) => {
          if (typeof c !== 'string') {
            c = '' + c;
          }
          return c.replace(/[^\\]\|/, '\\|');
        })
        .join(' | ') ?? '';
  };

  $: splitContent && updateContent();
</script>

<div class="editor-content-card">
  <div class="editor-content-card-header">
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
            <label class="editor-content-field-row">
              <span class="editor-content-field-label">{param.name}</span>
              <Input
                class="editor-content-input"
                type={param.type ?? 'text'}
                bind:value={splitContent[index]}
                placeholder={param.name}
              />
            </label>
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
          <Input type="text" bind:value={splitContent[1]} placeholder="Size (for example 120px, 60%, auto)" />
        </ImageUploadInput>
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

  :global.input-property-title {
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
