<script lang="ts">
  import 'ress/dist/ress.min.css';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { onDestroy, onMount } from 'svelte';
  import CardEditor from '$components/card-editor/card-editor.svelte';
  import CurrentCard from '$components/card/current-card.svelte';
  import Sidebar from '$components/sidebar.svelte';
  import SidebarContainer from '$components/sidebar-container.svelte';
  import { currentCard } from '../stores';

  export let view: 'editor' | 'docs' | 'info' | 'print' = 'editor';
  export let contentMaxWidth = '800px';
  const minPanelWidth = 260;
  const maxPanelWidth = 520;
  const minCanvasWidth = 320;

  let viewportWidth = 0;
  let leftPanelWidth = 340;
  let rightPanelWidth = 340;
  let activeResize: 'left' | 'right' | undefined;
  let stopCardTracking = () => {};
  let cardTrackingDelay: ReturnType<typeof setTimeout> | undefined;
  const menuLogoUrl = `${base}/menu-logo.svg`;

  const isEditorView = () => view === 'editor';
  $: isRightSidebarVisible = isEditorView() && $currentCard !== -1;
  $: effectiveRightPanelWidth = isRightSidebarVisible ? rightPanelWidth : 0;

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const getMaxLeftPanelWidth = () =>
    clamp(viewportWidth - rightPanelWidth - minCanvasWidth, minPanelWidth, maxPanelWidth);

  const getMaxRightPanelWidth = () =>
    clamp(viewportWidth - leftPanelWidth - minCanvasWidth, minPanelWidth, maxPanelWidth);

  const startResize = (event: CustomEvent<{ side: 'left' | 'right' }>) => {
    activeResize = event.detail.side;
  };

  const stopResize = () => {
    activeResize = undefined;
  };

  const handleWindowMouseMove = (event: MouseEvent) => {
    if (!activeResize || viewportWidth <= 1100 || !isEditorView()) {
      return;
    }

    if (activeResize === 'left') {
      leftPanelWidth = clamp(event.clientX, minPanelWidth, getMaxLeftPanelWidth());
      return;
    }

    rightPanelWidth = clamp(viewportWidth - event.clientX, minPanelWidth, getMaxRightPanelWidth());
  };

  const closeView = async () => {
    await goto(`${base}/`);
  };

  const handleWindowKeydown = async (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.code === 'KeyP') {
      if (view === 'print') {
        return;
      }

      event.preventDefault();
      await goto(`${base}/print`);
    }
  };

  const syncCardTracking = () => {
    stopCardTracking();
    if (cardTrackingDelay) {
      clearTimeout(cardTrackingDelay);
      cardTrackingDelay = undefined;
    }

    if (isEditorView() || view === 'print') {
      return;
    }

    let trackingReady = false;
    cardTrackingDelay = setTimeout(() => {
      trackingReady = true;
    }, 0);

    stopCardTracking = currentCard.subscribe(() => {
      if (!trackingReady) {
        return;
      }

      void closeView();
    });
  };

  onMount(() => {
    syncCardTracking();
  });

  onDestroy(() => {
    stopCardTracking();
    if (cardTrackingDelay) {
      clearTimeout(cardTrackingDelay);
    }
  });

  $: view, syncCardTracking();
</script>

<svelte:window
  bind:innerWidth={viewportWidth}
  on:keydown={handleWindowKeydown}
  on:mousemove={handleWindowMouseMove}
  on:mouseup={stopResize}
/>

<div
  class:workspace-static-view={!isEditorView()}
  class="workspace"
  style={`--left-panel-width: ${leftPanelWidth}px; --right-panel-width: ${effectiveRightPanelWidth}px; --content-max-width: ${contentMaxWidth}; --workspace-watermark: url('${menuLogoUrl}');`}
>
  {#if isEditorView()}
    <div class="canvas-layer">
      <CurrentCard />
    </div>
  {:else}
    <main
      class="content-layer"
      aria-label={view === 'docs' ? 'Documentation' : view === 'info' ? 'Information' : 'Print preview'}
    >
      <div class="content-shell">
        <div class="content-shell-body">
          <slot />
        </div>
      </div>
    </main>
  {/if}

  <SidebarContainer side="left" width={leftPanelWidth} on:resizestart={startResize}>
    <Sidebar />
  </SidebarContainer>

  {#if isRightSidebarVisible}
    <SidebarContainer side="right" width={rightPanelWidth} on:resizestart={startResize}>
      {#key $currentCard}
        <CardEditor />
      {/key}
    </SidebarContainer>
  {/if}
</div>

<style lang="scss">
  .workspace {
    position: relative;
    min-height: 100vh;
    isolation: isolate;
  }

  .workspace::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image: var(--workspace-watermark);
    background-position: center;
    background-repeat: no-repeat;
    background-size: min(80vw, 80vh);
    opacity: 0.45;
    filter: saturate(0);
  }

  .canvas-layer {
    position: fixed;
    inset: 0 var(--right-panel-width) 0 var(--left-panel-width);
    z-index: 1;
  }

  .content-layer {
    --workspace-shell-surface: var(--color-surface-panel);
    --workspace-shell-glow: var(--color-white-65);
    position: fixed;
    inset: 0 0 0 var(--left-panel-width);
    z-index: 1;
    overflow-y: auto;
    background:
      radial-gradient(circle at top, var(--workspace-shell-glow), var(--color-white-0) 35%),
      var(--workspace-shell-surface);
  }

  .content-shell {
    min-height: 100%;
    padding: 1.5rem 1.5rem 1.5rem;
    position: relative;
  }

  .content-shell-body {
    margin: 0 auto;
    width: var(--content-max-width);
    max-width: 100%;
  }

  :global(html),
  :global(body) {
    overflow: hidden;
  }

  @media (max-width: 1100px) {
    .workspace {
      min-height: auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }

    .workspace::before {
      background-size: min(82vw, 82vh);
    }

    .canvas-layer,
    .content-layer {
      position: static;
      inset: auto;
      width: auto;
      min-height: 0;
      border-radius: 1rem;
      overflow: visible;
    }

    .content-shell {
      padding: 1rem;
    }

    :global(body) {
      overflow: auto;
    }
  }
</style>
