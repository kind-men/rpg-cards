<script lang="ts">
  import { getContentTypeDescriptor } from '$lib/card-content-types';
  import type { CardContentTypeV2 } from '$lib/card-content-types';
  import { getContentText, isContainerContent, setContentText } from '$lib/card-content';
  import { createEventDispatcher } from 'svelte';
  import type { SvelteComponent } from 'svelte';
  import { dragHandle } from 'svelte-dnd-action';
  import { Button, ButtonGroup, Icon } from 'sveltestrap';
  import { SPLIT_REGEX } from '../lib/constants';
  import type { CardContent } from '../model/card';
  import BoxesContentBlockEditor from './content-block-editors/boxes-content-block-editor.svelte';
  import BulletContentBlockEditor from './content-block-editors/bullet-content-block-editor.svelte';
  import CardtitleContentBlockEditor from './content-block-editors/cardtitle-content-block-editor.svelte';
  import DescriptionContentBlockEditor from './content-block-editors/description-content-block-editor.svelte';
  import DndspellblockContentBlockEditor from './content-block-editors/dndspellblock-content-block-editor.svelte';
  import DndstatsContentBlockEditor from './content-block-editors/dndstats-content-block-editor.svelte';
  import FillContentBlockEditor from './content-block-editors/fill-content-block-editor.svelte';
  import FooterContentBlockEditor from './content-block-editors/footer-content-block-editor.svelte';
  import PictureContentBlockEditor from './content-block-editors/picture-content-block-editor.svelte';
  import PropertyContentBlockEditor from './content-block-editors/property-content-block-editor.svelte';
  import RowContentBlockEditor from './content-block-editors/row-content-block-editor.svelte';
  import RuleContentBlockEditor from './content-block-editors/rule-content-block-editor.svelte';
  import SectionContentBlockEditor from './content-block-editors/section-content-block-editor.svelte';
  import SubtitleContentBlockEditor from './content-block-editors/subtitle-content-block-editor.svelte';
  import TextContentBlockEditor from './content-block-editors/text-content-block-editor.svelte';

  export let collapsed = true;
  export let content: CardContent;
  export let depth = 0;
  export let setCollapsedVersion = 0;
  export let setCollapsed = true;

  const dispatch = createEventDispatcher();
  let splitContent: string[] = [];
  let lastSyncedContentId: string | undefined;
  let lastSyncedSerializedContent = '';

  const contentEditorComponentMap: Record<CardContentTypeV2, typeof SvelteComponent> = {
    bullet: BulletContentBlockEditor,
    boxes: BoxesContentBlockEditor,
    cardtitle: CardtitleContentBlockEditor,
    description: DescriptionContentBlockEditor,
    dndspellblock: DndspellblockContentBlockEditor,
    dndstats: DndstatsContentBlockEditor,
    fill: FillContentBlockEditor,
    footer: FooterContentBlockEditor,
    picture: PictureContentBlockEditor,
    property: PropertyContentBlockEditor,
    row: RowContentBlockEditor,
    rule: RuleContentBlockEditor,
    section: SectionContentBlockEditor,
    subtitle: SubtitleContentBlockEditor,
    text: TextContentBlockEditor
  };

  $: typeDescriptor = getContentTypeDescriptor(content.type);
  $: contentEditorComponent = contentEditorComponentMap[content.type];

  const getSplitContentFromValue = (value: string) =>
    value?.split(SPLIT_REGEX) ?? typeDescriptor?.params?.map(() => '') ?? [];

  $: if (!isContainerContent(content)) {
    const serializedContent = getContentText(content);
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
    if (isContainerContent(content)) {
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

    if (getContentText(content) === nextContent) {
      return;
    }

    content = setContentText(content, nextContent);
    lastSyncedContentId = content.id;
    lastSyncedSerializedContent = nextContent;
  };

  $: if (!isContainerContent(content) && splitContent) {
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
        aria-label={`Drag ${typeDescriptor?.label ?? typeDescriptor?.name ?? content.type} content block`}
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
        <span>{typeDescriptor?.label ?? typeDescriptor?.name ?? content.type}</span>
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
      {#if isContainerContent(content) && content.type === 'row'}
        <RowContentBlockEditor
          bind:content
          {depth}
          {setCollapsed}
          {setCollapsedVersion}
          on:collapsechange={(event) => dispatch('collapsechange', event.detail)}
        />
      {:else if contentEditorComponent && typeDescriptor}
        <svelte:component this={contentEditorComponent} bind:splitContent {typeDescriptor} />
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

  :global(.editor-content-labeled-fields) {
    display: grid;
    gap: 0.5rem;
  }

  :global(.editor-content-field-row) {
    display: grid;
    gap: 0.2rem;
  }

  :global(.editor-content-field-label) {
    color: var(--editor-content-card-label);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  :global(.editor-row-summary) {
    display: grid;
    gap: 0.25rem;
  }

  :global(.editor-row-summary-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  :global(.editor-row-summary-label) {
    color: var(--editor-content-card-label);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  :global(.editor-row-summary-actions) {
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

  :global(.editor-row-summary-text) {
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

  :global(.editor-content-embedded-input) {
    position: relative;
  }

  :global(.small-input) {
    max-width: 10em;
  }

  :global(.editor-content-input-group .editor-content-input) {
    width: 100%;
    border-radius: var(--bs-border-radius);
  }

  :global(.editor-content-grid-fields) {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  }

  :global(.editor-content-grid-fields-compact) {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  }

  :global(.editor-content-embedded-input input.form-control) {
    padding-left: 2.1rem;
  }

  :global(.editor-content-input-icon) {
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

  :global(.editor-content-embedded-input .editor-content-input-with-icon),
  :global(.editor-content-embedded-input input.form-control.editor-content-input-with-icon) {
    padding-left: 2.1rem;
  }

  :global(.input-property-title) {
    max-width: 10em;
  }

  :global(.editor-content-note) {
    margin: 0;
    color: var(--editor-content-card-text-muted);
    font-size: 0.76rem;
    line-height: 1.45;
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
