<script lang="ts">
  import { uuid4 } from '$lib/uuid';
  import { Icon, Tooltip } from '@sveltestrap/sveltestrap';

  export let id: string = uuid4();
</script>

<button {id} class="hint-trigger" type="button" aria-label="Show hint">
  <Icon name="question-circle" />
</button>
<Tooltip target={id}>
  <slot />
</Tooltip>

<style lang="scss">
  .hint-trigger {
    --hint-trigger-text: var(--color-ink-550);
    --hint-trigger-text-hover: var(--color-ink-900);
    --hint-trigger-hover-surface: var(--color-overlay-muted);
    width: 1.1rem;
    height: 1.1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--hint-trigger-text);
    transition: background-color 120ms ease, color 120ms ease;

    &:hover {
      background: var(--hint-trigger-hover-surface);
      color: var(--hint-trigger-text-hover);
    }

    :global(svg) {
      width: 0.8rem;
      height: 0.8rem;
    }
  }
</style>

