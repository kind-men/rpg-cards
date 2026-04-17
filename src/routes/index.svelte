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

  let infoModalOpen = false;
  const toggleInfoModal = () => (infoModalOpen = !infoModalOpen);
</script>

<div class="workspace">
  <div class="canvas-layer">
    <CurrentCard />
  </div>

  <aside class="floating-panel floating-panel-left shadow">
    <Sidebar on:info={toggleInfoModal} />
  </aside>

  <aside class="floating-panel floating-panel-right shadow">
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
  $panel-width: min(24rem, 32vw);

  .workspace {
    position: relative;
    min-height: 100vh;
  }

  .canvas-layer {
    position: fixed;
    inset: 0 $panel-width 0 $panel-width;
  }

  .floating-panel {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 10;
    width: $panel-width;
    padding: 1rem 1rem 1.5rem;
    overflow-y: auto;
    background: #ffffff;
  }

  .floating-panel-left {
    left: 0;
    border-right: 1px solid rgba(18, 38, 63, 0.08);
  }

  .floating-panel-right {
    right: 0;
    border-left: 1px solid rgba(18, 38, 63, 0.08);
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
      border: 1px solid rgba(18, 38, 63, 0.08);
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
