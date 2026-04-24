<script lang="ts">
  import { uuid4 } from '$lib/uuid';
  import { Icon, Tooltip } from 'sveltestrap';

  export let id: string = uuid4();
</script>

<button {id} class="hint-trigger" type="button" aria-label="Show hint">
  <Icon name="question-circle" />
</button>
<Tooltip target={id} autohide={false}>
  <slot />
</Tooltip>

<style lang="scss">
  .hint-trigger {
    width: 1.1rem;
    height: 1.1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: #6a7688;
    transition: background-color 120ms ease, color 120ms ease;

    &:hover {
      background: rgba(18, 38, 63, 0.06);
      color: #223047;
    }

    :global(svg) {
      width: 0.8rem;
      height: 0.8rem;
    }
  }
</style>
