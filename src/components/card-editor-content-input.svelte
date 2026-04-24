<script lang="ts">
  import { getContentTypeDescriptor } from '$lib/card-content-types';
  import { createEventDispatcher } from 'svelte';
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
  import GameIcon from './game-icon.svelte';

  export let content: CardContent;
  $: typeDescriptor = getContentTypeDescriptor(content.type);

  let splitContent = content.content?.split(SPLIT_REGEX) ?? typeDescriptor.params.map(() => '');

  const dispatch = createEventDispatcher();
  const CONTENT_TYPE_ICONS = {
    cardtitle: 'queen-crown',
    text: 'scroll-unfurled',
    subtitle: 'bookmarklet',
    rule: 'split-cross',
    property: 'quill-ink',
    description: 'rule-book',
    section: 'upgrade',
    boxes: 'empty-chessboard',
    fill: 'resize',
    bullet: 'bullet-impacts',
    picture: 'photo-camera',
    dndstats: 'crossed-swords',
    dndspellblock: 'spell-book'
  } as const;
  $: typeIconName = CONTENT_TYPE_ICONS[content.type] ?? 'plain-circle';
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

<InputGroup>
  <InputGroupText class="content-type-icon-wrapper" id={typeIconTarget}>
    <GameIcon name={typeIconName} color="#d3d7de" size="1rem" />
  </InputGroupText>
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
<Tooltip target={typeIconTarget} placement="top">{typeDescriptor.name}</Tooltip>
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

<style lang="scss">
  :global(.content-type-icon-wrapper),
  :global(.input-group-text.content-type-icon-wrapper) {
    width: 1.25rem;
    min-width: 1.25rem;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 0.25rem 0 !important;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
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

  :global(.editor-content-actions .btn:last-child) {
    padding: 0 !important;
  }

  :global(.editor-content-actions .btn:hover) {
    color: #223047;
  }
</style>
