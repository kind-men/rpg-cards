<script lang="ts">
  import 'ress/dist/ress.min.css';
  import {
    Accordion,
    AccordionItem,
    Modal,
    ModalBody
  } from 'sveltestrap';
  import CardEditor from '$components/card-editor.svelte';
  import Sidebar from '$components/sidebar.svelte';
  import SidebarContainer from '$components/sidebar-container.svelte';
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

  const startResize = (event: CustomEvent<{ side: 'left' | 'right' }>) => {
    activeResize = event.detail.side;
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

  <SidebarContainer
    side="left"
    width={leftPanelWidth}
    on:resizestart={startResize}
  >
    <Sidebar on:info={toggleInfoModal} />
  </SidebarContainer>

  <SidebarContainer
    side="right"
    width={rightPanelWidth}
    on:resizestart={startResize}
  >
    <CardEditor />
  </SidebarContainer>
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

  @media (max-width: 1100px) {
    .workspace {
      min-height: auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }

    .canvas-layer {
      position: static;
      inset: auto;
      width: auto;
      min-height: 0;
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
