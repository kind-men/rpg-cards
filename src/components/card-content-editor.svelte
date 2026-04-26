<script lang="ts">
  import { flip } from 'svelte/animate';
  import { createEventDispatcher } from 'svelte';
  import type { CardContent } from '../model/card';
  import CardEditorContentInput from './card-editor-content-input.svelte';
  import { dragHandleZone } from 'svelte-dnd-action';
  import { Button, Icon, Input, InputGroup } from 'sveltestrap';
  import { createNewCardContent } from '../lib/card-builder';
  import { CardContentTypeV2, CARD_CONTENT_TYPES } from '$lib/card-content-types';
  import { uuid4 } from '$lib/uuid';
  import { hoveredContentId } from '../stores';

  export let contents: CardContent[];
  export let setCollapsedVersion = 0;
  export let setCollapsed = true;
  const flipDurationMs = 200;
  const dispatch = createEventDispatcher<{ collapsechange: { hasExpandedItems: boolean } }>();
  let collapsedById: Record<string, boolean> = {};
  let lastSetCollapsedVersion = 0;
  let hasExpandedItems = false;

  const handleSort = (e: CustomEvent<any>): void => {
    contents = e.detail.items;
  };

  const handleDelete = (index: number): void => {
    const newList = [...contents];
    newList.splice(index, 1);
    contents = newList;
  };

  const handleDuplicate = (index: number): void => {
    const newList = [...contents];
    newList.push({ ...contents[index], id: uuid4() });
    contents = newList;
  };

  let addType: CardContentTypeV2 = 'text';
  const handleAdd = (e: MouseEvent): void => {
    e.preventDefault();
    const newList = [...contents];
    newList.push(createNewCardContent(addType));
    contents = newList;
  };

  $: if (contents?.some((content) => !content.id)) {
    contents = contents.map((content) => ({
      ...content,
      id: content.id ?? uuid4()
    }));
  }

  const setAllCollapsed = (collapsed: boolean) => {
    collapsedById = Object.fromEntries(
      (contents ?? []).map((content) => [content.id ?? '', collapsed])
    );
  };

  const toggleCollapsed = (contentId: string) => {
    collapsedById = {
      ...collapsedById,
      [contentId]: !(collapsedById[contentId] ?? true)
    };
  };

  $: if (contents?.length) {
    const nextState = { ...collapsedById };
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
        changed = true;
      }
    }

    if (changed) {
      collapsedById = nextState;
    }
  }

  $: if (setCollapsedVersion !== lastSetCollapsedVersion) {
    lastSetCollapsedVersion = setCollapsedVersion;
    setAllCollapsed(setCollapsed);
  }

  $: hasExpandedItems =
    contents?.some((content) => content.id && collapsedById[content.id] === false) ?? false;
  $: dispatch('collapsechange', { hasExpandedItems });
</script>

<div class="content-editor-list">
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
          <CardEditorContentInput
            bind:content
            collapsed={content.id ? (collapsedById[content.id] ?? true) : true}
            on:delete={() => handleDelete(index)}
            on:duplicate={() => handleDuplicate(index)}
            on:togglecollapse={() => content.id && toggleCollapsed(content.id)}
          />
        </div>
      </div>
    {/each}
  </div>
  <InputGroup class="add-new-selector">
    <Input type="select" bind:value={addType}>
      {#each CARD_CONTENT_TYPES as type}
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

  .content-editor-items {
    display: grid;
    gap: 0.5rem;
  }

  .input-wrapper {
    display: flex;
    align-items: flex-start;
    width: 100%;
  }

  :global.add-new-selector {
    margin-top: 1rem;
  }
</style>
