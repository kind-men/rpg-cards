<script lang="ts">
  import { getContentTypeDescriptor } from '$lib/card-content-types';
  import { createEventDispatcher } from 'svelte';
  import { dragHandle } from 'svelte-dnd-action';
  import {
    Button,
    ButtonGroup,
    Icon,
    Input,
    InputGroup,
    InputGroupText,
    Tooltip
  } from 'sveltestrap';
  import { SPLIT_REGEX } from '../lib/constants';
  import type { CardContent } from '../model/card';
  import MarkdownEditor from './markdown-editor.svelte';

  export let content: CardContent;
  $: typeDescriptor = getContentTypeDescriptor(content.type);

  let splitContent = content.content?.split(SPLIT_REGEX) ?? typeDescriptor.params.map(() => '');

  const dispatch = createEventDispatcher();
  $: typeIconTarget = `content-type-icon-${content.id ?? content.type}`;

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
        aria-label={`Drag ${typeDescriptor.name} content item`}
      >
        <Icon name="grip-vertical" />
      </button>
      <div class="editor-content-card-title" id={typeIconTarget}>
        <span>{typeDescriptor.name}</span>
      </div>
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

  <div
    class="editor-content-card-body"
    class:editor-content-card-body-text={content.type === 'text'}
  >
    {#if content.type === 'text'}
      <MarkdownEditor bind:value={splitContent[0]} height="280px" />
    {:else}
      <InputGroup class="editor-content-input-group">
        {#if typeDescriptor.params.length === 0}
          <Input disabled />
        {:else}
          {#each typeDescriptor.params as param, index}
            <Input
              type={param.type ?? 'text'}
              bind:value={splitContent[index]}
              placeholder={param.name}
            />
          {/each}
        {/if}
      </InputGroup>
    {/if}
  </div>
</div>
<Tooltip target={typeIconTarget} placement="top">{typeDescriptor.name}</Tooltip>

<style lang="scss">
  .editor-content-card {
    width: 100%;
    display: grid;
    border: 1px solid rgba(18, 38, 63, 0.08);
    border-radius: var(--bs-border-radius);
    background: #ffffff;
    overflow: hidden;
    box-shadow: 0 3px 10px rgba(18, 38, 63, 0.06);
  }

  .editor-content-card-header {
    padding: 0.45rem 0.6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom: 1px solid rgba(18, 38, 63, 0.08);
  }

  .editor-content-card-heading {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .editor-content-card-title {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    color: #223047;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: capitalize;
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
    color: #8b96a8;
    cursor: grab;
    flex: 0 0 auto;
  }

  .editor-content-drag-handle:hover {
    background: rgba(18, 38, 63, 0.06);
    color: #223047;
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

  :global(.editor-content-input-group) {
    margin-bottom: 0;
  }

  :global(.small-input) {
    max-width: 10em;
  }

  :global.input-property-title {
    max-width: 10em;
  }

  :global(.editor-content-actions .btn) {
    padding: 0.125rem 0.25rem;
    color: #5f6d80;
  }

  :global(.editor-content-actions) {
    flex: 0 0 auto;
    align-self: auto;
  }

  :global(.editor-content-actions .btn:last-child) {
    padding: 0 !important;
  }

  :global(.editor-content-actions .btn:hover) {
    color: #223047;
  }
</style>
