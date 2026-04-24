<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let side: 'left' | 'right';
  export let width: number;
  export let scrollable = false;
  const dispatch = createEventDispatcher<{ resizestart: { side: 'left' | 'right' } }>();

  const startResize = (event: MouseEvent) => {
    event.preventDefault();
    dispatch('resizestart', { side });
  };
</script>

<aside
  class:sidebar-container-left={side === 'left'}
  class:sidebar-container-right={side === 'right'}
  class:sidebar-container-scrollable={scrollable}
  class="sidebar-container"
  style={`--sidebar-width: ${width}px;`}
>
  {#if side === 'right'}
    <button
      class="sidebar-resize-handle sidebar-resize-handle-left"
      type="button"
      aria-label="Resize right sidebar"
      on:mousedown={startResize}
    />
  {/if}

  <div class="sidebar-container-content">
    <slot />
  </div>

  {#if side === 'left'}
    <button
      class="sidebar-resize-handle sidebar-resize-handle-right"
      type="button"
      aria-label="Resize left sidebar"
      on:mousedown={startResize}
    />
  {/if}
</aside>

<style lang="scss">
  .sidebar-container {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 10;
    width: var(--sidebar-width);
    padding: 1rem 1rem .5rem 1rem;
    overflow: hidden;
    background: #ffffff;
    box-shadow: none;
  }

  .sidebar-container-left {
    left: 0;
    border-right: 1px solid rgba(18, 38, 63, 0.14);
  }

  .sidebar-container-right {
    right: 0;
    border-left: 1px solid rgba(18, 38, 63, 0.14);
  }

  .sidebar-container-content {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .sidebar-container-scrollable {
    overflow-y: auto;
  }

  .sidebar-container-scrollable .sidebar-container-content {
    height: auto;
    min-height: 100%;
  }

  .sidebar-resize-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 0.7rem;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: ew-resize !important;
  }

  .sidebar-resize-handle::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: rgba(18, 38, 63, 0.14);
    transform: translateX(-50%);
    transition: background-color 120ms ease, width 120ms ease;
  }

  .sidebar-resize-handle:hover::after {
    width: 2px;
    background: rgba(18, 38, 63, 0.35);
  }

  .sidebar-resize-handle-right {
    right: 0;
    transform: translateX(50%);
  }

  .sidebar-resize-handle-left {
    left: 0;
    transform: translateX(-50%);
  }

  .sidebar-container-content :global(.sidebar-section) {
    padding: 0 0 1rem;
    border-bottom: 1px solid rgba(18, 38, 63, 0.08);
  }

  .sidebar-container-content :global(.sidebar-section:first-child) {
    padding-top: 0;
  }

  .sidebar-container-content :global(.sidebar-section:last-child) {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .sidebar-container-content :global(.sidebar-section-grow) {
    min-height: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
  }

  .sidebar-container-content :global(.sidebar-section-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.85rem;
  }

  .sidebar-container-content :global(.sidebar-section-title) {
    margin: 0;
    color: #223047;
    font-size: var(--section-title-size);
    font-weight: var(--section-title-weight);
    letter-spacing: var(--section-title-spacing);
    text-transform: none;
  }

  .sidebar-container-content :global(.sidebar-section-body) {
    min-height: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 0.35rem;
  }

  .sidebar-container-content :global(.sidebar-form) {
    display: grid;
    gap: 0.6rem;
    font-size: var(--editor-form-font-size);
  }

  .sidebar-container-content :global(.sidebar-field) {
    display: grid;
    gap: 0.25rem;
  }

  .sidebar-container-content :global(.sidebar-field-inline) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .sidebar-container-content :global(.sidebar-field-label) {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .sidebar-container-content :global(form) {
    font-size: var(--editor-form-font-size);
  }

  .sidebar-container-content :global(.col-form-label) {
    padding: 0;
    color: #223047;
    font-size: var(--editor-form-font-size);
    line-height: var(--editor-form-label-line-height);
  }

  .sidebar-container-content :global(.form-control),
  .sidebar-container-content :global(.input-group-text),
  .sidebar-container-content :global(.form-select),
  .sidebar-container-content :global(input),
  .sidebar-container-content :global(textarea),
  .sidebar-container-content :global(select) {
    font-size: var(--editor-form-font-size);
  }

  .sidebar-container-content :global(.form-control),
  .sidebar-container-content :global(.input-group-text),
  .sidebar-container-content :global(.form-select) {
    padding-left: var(--editor-form-control-padding-x);
    padding-right: var(--editor-form-control-padding-x);
    padding-top: var(--editor-form-control-padding-y);
    padding-bottom: var(--editor-form-control-padding-y);
    border-radius: var(--editor-form-control-radius);
  }

  @media (max-width: 1100px) {
    .sidebar-container {
      position: static;
      inset: auto;
      width: auto;
      min-height: 0;
      overflow: visible;
      border: 1px solid rgba(18, 38, 63, 0.14);
    }

    .sidebar-resize-handle {
      display: none;
    }
  }
</style>
