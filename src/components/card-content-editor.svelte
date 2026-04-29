<script lang="ts">
  import { flip } from 'svelte/animate';
  import { createEventDispatcher } from 'svelte';
  import { dragHandleZone } from 'svelte-dnd-action';
  import { Button, Icon, Input, InputGroup } from 'sveltestrap';
  import { createNewCardContent } from '../lib/card-builder';
  import {
    cloneCardContentWithNewIds,
    getContentChildren,
    hasChildCollections,
    withContentIds
  } from '../lib/card-content';
  import { CARD_CONTENT_TYPES } from '$lib/card-content-types';
  import type { CardContentType } from '$lib/card-content-types';
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
  let addType: CardContentType = 'text';
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

  const hasMissingIds = (list: CardContent[]): boolean =>
    list.some(
      (content) => !content.id || (hasChildCollections(content) && hasMissingIds(getContentChildren(content).flat()))
    );

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
              on:delete={() => handleDelete(index)}
              on:duplicate={() => handleDuplicate(index)}
              depth={depth}
              {setCollapsed}
              {setCollapsedVersion}
              on:collapsechange={(event) =>
                content.id && updateNestedExpanded(content.id, event.detail.hasExpandedItems)}
              on:togglecollapse={() => content.id && toggleCollapsed(content.id)}
            />
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

  :global(.add-new-selector) {
    margin-top: 1rem;
  }

  :global(.add-new-selector.add-new-selector-nested) {
    margin-top: 0.35rem;
  }
</style>
