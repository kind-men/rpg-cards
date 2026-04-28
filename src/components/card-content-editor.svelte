<script lang="ts">
  import { flip } from 'svelte/animate';
  import { createEventDispatcher } from 'svelte';
  import { dragHandleZone } from 'svelte-dnd-action';
  import { Button, Icon, Input, InputGroup } from 'sveltestrap';
  import { createNewCardContent } from '../lib/card-builder';
  import { cloneCardContentWithNewIds, isRowCardContent, withContentIds } from '../lib/card-content';
  import { CardContentTypeV2, CARD_CONTENT_TYPES } from '$lib/card-content-types';
  import type { CardContent } from '../model/card';
  import { hoveredContentId } from '../stores';
  import CardEditorContentInput from './card-editor-content-input.svelte';

  export let allowFooter = true;
  export let contents: CardContent[];
  export let depth = 0;
  export let setCollapsedVersion = 0;
  export let setCollapsed = true;

  const flipDurationMs = 200;
  const dispatch = createEventDispatcher<{ collapsechange: { hasExpandedItems: boolean } }>();
  let addType: CardContentTypeV2 = 'text';
  let collapsedById: Record<string, boolean> = {};
  let hasExpandedItems = false;
  let lastSetCollapsedVersion = 0;
  let nestedExpandedById: Record<string, boolean> = {};

  $: availableTypes = CARD_CONTENT_TYPES.filter((type) => allowFooter || type.name !== 'footer');
  $: if (!availableTypes.some((type) => type.name === addType)) {
    addType = availableTypes[0]?.name ?? 'text';
  }

  const handleSort = (e: CustomEvent<any>): void => {
    contents = e.detail.items;
  };

  const handleDelete = (index: number): void => {
    const nextContents = [...contents];
    nextContents.splice(index, 1);
    contents = nextContents;
  };

  const handleDuplicate = (index: number): void => {
    const nextContents = [...contents];
    nextContents.push(cloneCardContentWithNewIds(nextContents[index]));
    contents = nextContents;
  };

  const handleAdd = (e: MouseEvent): void => {
    e.preventDefault();
    contents = [...contents, createNewCardContent(addType)];
  };

  const handleAddColumn = (index: number): void => {
    const content = contents[index];

    if (!isRowCardContent(content)) {
      return;
    }

    const nextContents = [...contents];
    nextContents[index] = {
      ...content,
      columns: [...content.columns, []]
    };
    contents = nextContents;
  };

  const handleRemoveColumn = (index: number): void => {
    const content = contents[index];

    if (!isRowCardContent(content) || content.columns.length <= 2) {
      return;
    }

    const nextContents = [...contents];
    nextContents[index] = {
      ...content,
      columns: content.columns.slice(0, -1)
    };
    contents = nextContents;
  };

  const hasMissingIds = (list: CardContent[]): boolean =>
    list.some((content) => !content.id || (isRowCardContent(content) && hasMissingIds(content.columns.flat())));

  const setAllCollapsedState = (collapsed: boolean) => {
    collapsedById = Object.fromEntries((contents ?? []).map((content) => [content.id ?? '', collapsed]));
  };

  const toggleCollapsed = (contentId: string) => {
    collapsedById = {
      ...collapsedById,
      [contentId]: !(collapsedById[contentId] ?? true)
    };
  };

  const updateNestedExpanded = (contentId: string, expanded: boolean) => {
    nestedExpandedById = {
      ...nestedExpandedById,
      [contentId]: expanded
    };
  };

  $: if (contents?.length && hasMissingIds(contents)) {
    contents = withContentIds(contents);
  }

  $: if (contents?.length) {
    const nextState = { ...collapsedById };
    const nextNestedState = { ...nestedExpandedById };
    let changed = false;

    for (const content of contents) {
      if (content.id && nextState[content.id] === undefined) {
        nextState[content.id] = true;
        changed = true;
      }
    }

    for (const key of Object.keys(nextState)) {
      if (!contents.some((content) => content.id === key)) {
        delete nextState[key];
        delete nextNestedState[key];
        changed = true;
      }
    }

    if (changed) {
      collapsedById = nextState;
      nestedExpandedById = nextNestedState;
    }
  }

  $: if (setCollapsedVersion !== lastSetCollapsedVersion) {
    lastSetCollapsedVersion = setCollapsedVersion;
    setAllCollapsedState(setCollapsed);
  }

  $: hasExpandedItems =
    contents?.some(
      (content) =>
        (content.id && collapsedById[content.id] === false) ||
        (content.id && nestedExpandedById[content.id] === true)
    ) ?? false;
  $: dispatch('collapsechange', { hasExpandedItems });
</script>

<div class="content-editor-list" class:content-editor-list-nested={depth > 0}>
  <div
    class="content-editor-items"
    use:dragHandleZone={{ items: contents, flipDurationMs, dropTargetStyle: {} }}
    on:consider={handleSort}
    on:finalize={handleSort}
  >
    {#each contents as content, index (content.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        <div
          class="input-wrapper"
          on:mouseenter={() => hoveredContentId.set(content.id ?? null)}
          on:mouseleave={() => hoveredContentId.set(null)}
        >
          <div class="input-stack">
            <CardEditorContentInput
              bind:content
              collapsed={content.id ? (collapsedById[content.id] ?? true) : true}
              columnCount={isRowCardContent(content) ? content.columns.length : 0}
              canRemoveColumn={isRowCardContent(content) && content.columns.length > 2}
              on:addcolumn={() => handleAddColumn(index)}
              on:delete={() => handleDelete(index)}
              on:duplicate={() => handleDuplicate(index)}
              on:removecolumn={() => handleRemoveColumn(index)}
              on:togglecollapse={() => content.id && toggleCollapsed(content.id)}
            />

            {#if isRowCardContent(content) && !(content.id ? (collapsedById[content.id] ?? true) : true)}
              <div class="row-editor-columns">
                {#each content.columns as column, columnIndex}
                  <div class="row-editor-column">
                    <div class="row-editor-column-header">
                      <span class="row-editor-column-title">Column {columnIndex + 1}</span>
                      <span class="row-editor-column-meta">{column.length} items</span>
                    </div>
                    <svelte:self
                      bind:contents={content.columns[columnIndex]}
                      allowFooter={false}
                      depth={depth + 1}
                      {setCollapsed}
                      {setCollapsedVersion}
                      on:collapsechange={(event) =>
                        content.id && updateNestedExpanded(content.id, event.detail.hasExpandedItems)}
                    />
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <InputGroup class={`add-new-selector ${depth > 0 ? 'add-new-selector-nested' : ''}`}>
    <Input type="select" bind:value={addType}>
      {#each availableTypes as type}
        <option id="select-{type.name}" value={type.name}>{type.label ?? type.name}</option>
      {/each}
    </Input>
    <Button color="primary" on:click={handleAdd}>
      <Icon name="plus" />
    </Button>
  </InputGroup>
</div>

<style lang="scss">
  .content-editor-list {
    display: grid;
  }

  .content-editor-list-nested {
    padding-left: 0.65rem;
    border-left: 1px solid var(--color-border-soft);
  }

  .content-editor-items {
    display: grid;
    gap: 0.5rem;
  }

  .input-wrapper {
    display: flex;
    align-items: flex-start;
    width: 100%;
  }

  .input-stack {
    width: 100%;
    display: grid;
    gap: 0.5rem;
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

  :global(.add-new-selector) {
    margin-top: 1rem;
  }

  :global(.add-new-selector.add-new-selector-nested) {
    margin-top: 0.35rem;
  }
</style>
