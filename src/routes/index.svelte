<script lang="ts">
  import 'ress/dist/ress.min.css';
  import {
    Accordion,
    AccordionItem,
    Modal,
    ModalBody
  } from 'sveltestrap';
  import Sidebar from '$components/sidebar.svelte';
  import CardEditor from '$components/card-editor.svelte';
  import CurrentCard from '$components/card/current-card.svelte';
  import InfoContent from '../content/info.svx';
  import ThanksAndLicensesContent from '../content/thanks-and-licenses.svx';

  const minPanelWidth = 260;
  const maxPanelWidth = 520;
  const minCanvasWidth = 320;

  let infoModalOpen = false;
  let viewportWidth = 0;
  let leftPanelWidth = 340;
  let rightPanelWidth = 340;
  let activeResize: 'left' | 'right' | undefined;

  const toggleInfoModal = () => (infoModalOpen = !infoModalOpen);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const getMaxLeftPanelWidth = () =>
    clamp(viewportWidth - rightPanelWidth - minCanvasWidth, minPanelWidth, maxPanelWidth);

  const getMaxRightPanelWidth = () =>
    clamp(viewportWidth - leftPanelWidth - minCanvasWidth, minPanelWidth, maxPanelWidth);

  const startResize = (side: 'left' | 'right', event: MouseEvent) => {
    event.preventDefault();
    activeResize = side;
  };

  const stopResize = () => {
    activeResize = undefined;
  };

  const handleWindowMouseMove = (event: MouseEvent) => {
    if (!activeResize || viewportWidth <= 1100) {
      return;
    }

    if (activeResize === 'left') {
      leftPanelWidth = clamp(event.clientX, minPanelWidth, getMaxLeftPanelWidth());
      return;
    }

    rightPanelWidth = clamp(viewportWidth - event.clientX, minPanelWidth, getMaxRightPanelWidth());
  };
</script>

<svelte:window bind:innerWidth={viewportWidth} on:mousemove={handleWindowMouseMove} on:mouseup={stopResize} />

<div
  class="workspace"
  style={`--left-panel-width: ${leftPanelWidth}px; --right-panel-width: ${rightPanelWidth}px;`}
>
  <div class="canvas-layer">
    <CurrentCard />
  </div>

  <aside class="floating-panel floating-panel-left">
    <Sidebar on:info={toggleInfoModal} />
    <button
      class="panel-resize-handle panel-resize-handle-right"
      type="button"
      aria-label="Resize left sidebar"
      on:mousedown={(event) => startResize('left', event)}
    />
  </aside>

  <aside class="floating-panel floating-panel-right">
    <button
      class="panel-resize-handle panel-resize-handle-left"
      type="button"
      aria-label="Resize right sidebar"
      on:mousedown={(event) => startResize('right', event)}
    />
    <CardEditor />
  </aside>
</div>
<Modal header="Info" class="info-modal" isOpen={infoModalOpen} toggle={toggleInfoModal}>
  <ModalBody class="p-0">
    <div class="info-modal-text">
      <InfoContent />
    </div>
    <Accordion flush>
      <AccordionItem header="Thanks and licenses">
        <ThanksAndLicensesContent />
      </AccordionItem>
    </Accordion>
  </ModalBody>
</Modal>

<style lang="scss">
  .workspace {
    position: relative;
    min-height: 100vh;
  }

  .canvas-layer {
    position: fixed;
    inset: 0 var(--right-panel-width) 0 var(--left-panel-width);
  }

  .floating-panel {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 10;
    width: var(--left-panel-width);
    padding: 1rem 1rem 1.5rem;
    overflow-y: auto;
    background: #ffffff;
    box-shadow: none;
  }

  .floating-panel-left {
    left: 0;
    width: var(--left-panel-width);
    border-right: 1px solid rgba(18, 38, 63, 0.14);
  }

  .floating-panel-right {
    right: 0;
    width: var(--right-panel-width);
    border-left: 1px solid rgba(18, 38, 63, 0.14);
  }

  .panel-resize-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 0.7rem;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: ew-resize !important;
  }

  .panel-resize-handle::after {
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

  .panel-resize-handle:hover::after {
    width: 2px;
    background: rgba(18, 38, 63, 0.35);
  }

  .panel-resize-handle-right {
    right: 0;
    transform: translateX(50%);
  }

  .panel-resize-handle-left {
    left: 0;
    transform: translateX(-50%);
  }

  @media (max-width: 1100px) {
    .workspace {
      min-height: auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }

    .canvas-layer,
    .floating-panel {
      position: static;
      inset: auto;
      width: auto;
      min-height: 0;
    }

    .floating-panel {
      overflow: visible;
      border: 1px solid rgba(18, 38, 63, 0.14);
    }

    .panel-resize-handle {
      display: none;
    }
  }

  .info-modal-text {
    padding: 1em;
  }

  :global(.info-modal) {
    $width: 700px;
    margin: 0 auto;
    @media (min-width: $width) {
      min-width: $width;
    }
  }

  :global(.modal) {
    overflow-y: scroll;
  }

  :global(body) {
    overflow: hidden;
  }

  @media (max-width: 1100px) {
    :global(body) {
      overflow: auto;
    }
  }
</style>
