<script lang="ts">
  import { getContentChildren } from '$lib/card-content';
  import type { CardContent } from '$model/card';
  import { createEventDispatcher } from 'svelte';
  import { Button, Icon } from '@sveltestrap/sveltestrap';
  import CardContentBlocksEditor from '../card-content-blocks-editor.svelte';

  export let content: CardContent;
  export let depth = 0;
  export let setCollapsedVersion = 0;
  export let setCollapsed = true;

  const dispatch = createEventDispatcher<{ collapsechange: { hasExpandedItems: boolean } }>();
  $: columns = getContentChildren(content);
  $: columnCount = columns.length;
  $: canRemoveColumn = columnCount > 2;

  const handleAddColumn = () => {
    content = {
      ...content,
      children: [...columns, []]
    };
  };

  const handleRemoveColumn = () => {
    if (!canRemoveColumn) {
      return;
    }

    content = {
      ...content,
      children: columns.slice(0, -1)
    };
  };
</script>

<div class="editor-row-summary">
  <div class="editor-row-summary-header">
    <div class="editor-row-summary-label">Nested layout</div>
    <div class="editor-row-summary-meta">{columnCount} columns</div>
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
        handleAddColumn();
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
        handleRemoveColumn();
      }}
    >
      <Icon name="dash-lg" />
      <span>Remove column</span>
    </Button>
  </div>
</div>

<div class="row-editor-columns">
  {#each columns as column, columnIndex}
    <div class="row-editor-column">
      <div class="row-editor-column-header">
        <span class="row-editor-column-title">Column {columnIndex + 1}</span>
        <span class="row-editor-column-meta">{column.length} items</span>
      </div>
      <CardContentBlocksEditor
        bind:contents={content.children[columnIndex]}
        allowFooter={false}
        depth={depth + 1}
        {setCollapsed}
        {setCollapsedVersion}
        on:collapsechange={(event) => dispatch('collapsechange', event.detail)}
      />
    </div>
  {/each}
</div>

<style lang="scss">
  .editor-row-summary-meta {
    color: var(--color-ink-575);
    font-size: 0.72rem;
    font-weight: 500;
    text-transform: none;
  }

  .row-editor-columns {
    display: grid;
    gap: 0.5rem;
  }

  .row-editor-column {
    padding: 0.55rem;
    display: grid;
    gap: 0.5rem;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--bs-border-radius);
    background: var(--color-surface-panel);
  }

  .row-editor-column-header {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: center;
  }

  .row-editor-column-title {
    color: var(--color-ink-900);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .row-editor-column-meta {
    color: var(--color-ink-550);
    font-size: 0.72rem;
  }
</style>

