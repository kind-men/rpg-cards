<script lang="ts">
  import { Button, InputGroup, InputGroupText, Icon } from '@sveltestrap/sveltestrap';
  import GameIcon from '../game-icon.svelte';
  import AutoComplete from 'simple-svelte-autocomplete';
  import { getAllIconNames } from '$lib/icons';

  export let icon: string | null | undefined;
  export let name: string;
  export let id: string;
  export let placeholder: string = undefined;
  export let isMultiEditing: boolean;

  $: text = icon ?? null;
  let changed = false;

  const handleTextChanges = () => {
    if (!changed || (isMultiEditing && text === '')) {
      return;
    }

    icon = text;
  };
  $: {
    text;
    handleTextChanges();
  }

  const searchIcons = (query: string) => {
    return getAllIconNames(query);
  };

  const clearIcon = () => {
    changed = true;
    text = '';
    icon = '';
  };
</script>

<InputGroup class="game-icon-input-group">
  <InputGroupText class="game-icon-input-icon-wrapper">
    {#if (text === null && isMultiEditing) || (text === '' && isMultiEditing)}
      <GameIcon name={'stack'} color="black" size="1.5em" />
    {:else}
      <GameIcon name={icon} color="black" size="1.5em" />
    {/if}
  </InputGroupText>

  <!-- <Input type="text" {name} {id} bind:value={icon} autocomplete="off" placeholder="Icon" /> -->
  <AutoComplete
    searchFunction={searchIcons}
    delay="200"
    hideArrow
    inputId={id}
    {name}
    inputClassName="form-control autocomplete-input"
    bind:selectedItem={icon}
    bind:text
    onChange={() => (changed = true)}
    class="autocomplete"
    {placeholder}
    showClear={false}
  >
    <div class="autocomplete-result-item" slot="item" let:item let:label>
      <GameIcon name={item} color="black" size="1.5em" />
      <span>
        {@html label}
      </span>
    </div>
  </AutoComplete>

  <InputGroupText class="game-icon-input-actions">
    <Button
      type="button"
      color="link"
      class="game-icon-input-action"
      aria-label="Clear icon"
      disabled={!text}
      on:click={clearIcon}
    >
      <Icon name="x-lg" />
    </Button>
    <a
      class="game-icon-input-action"
      href="https://game-icons.net"
      target="_blank"
      aria-label="Open Game-icons.net"
    >
      <Icon name="box-arrow-up-right" />
    </a>
  </InputGroupText>
</InputGroup>

<style lang="scss">
  :global(.game-icon-input-group) {
    flex-wrap: nowrap;
    align-items: stretch;
    min-height: 2rem;
  }

  :global(.autocomplete) {
    flex: 1 1 auto;
    min-width: 0;
    height: 2rem !important;
  }

  :global(.input-container) {
    width: 100%;
    min-width: 0;
    height: 100%;
  }

  :global(.input-container *) {
    border-radius: 0;
  }

  :global(.game-icon-input-group .autocomplete input[type='text']) {
    width: 100%;
    min-width: 0;
    height: 2rem;
    min-height: 2rem;
    padding: 0.25rem 0.45rem 0.25rem 0.55rem;
    border: 1px solid var(--bs-border-color, #ced4da);
    border-left: 0;
    border-right: 0;
    box-shadow: none;
    font-size: 0.86rem;
    line-height: 1.25;
  }

  :global(.game-icon-input-group .autocomplete input[type='text']:focus) {
    position: relative;
    z-index: 2;
    border-color: var(--bs-primary, #86b7fe);
    box-shadow: 0 0 0 0.12rem rgba(var(--bs-primary-rgb), 0.18);
  }

  .autocomplete-result-item {
    display: flex;
    align-items: center;
    gap: 1em;
  }

  :global(.game-icon-input-icon-wrapper) {
    width: 2.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.35rem;
  }

  :global(.game-icon-input-actions) {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    padding: 0.15rem 0.25rem;
  }

  :global(.game-icon-input-action) {
    width: 1.45rem;
    height: 1.45rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0.2rem;
    color: var(--bs-body-color);
    line-height: 1;
    text-decoration: none;
  }

  :global(.game-icon-input-action:hover:not(:disabled)) {
    background: var(--color-overlay-muted);
    color: var(--bs-body-color);
  }

  :global(.game-icon-input-action:disabled) {
    opacity: 0.35;
  }
</style>

