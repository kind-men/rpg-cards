<script lang="ts">
  import { settings } from '../../stores/settings';
  import { Button, Icon, Input, InputGroup, InputGroupText } from 'sveltestrap';
  import { currentCard, deck, pageLayout } from '../../stores';
  import CardComponent from './card.svelte';

  $: card = $deck[$currentCard];
</script>

<div class="canvas">
  <div class="zoom-input shadow-sm">
    <InputGroup>
      <InputGroupText class="p-0">
        <Button color="link" on:click={() => ($settings.previewZoom -= 10)}>
          <Icon name="zoom-out" />
        </Button>
      </InputGroupText>
      <Input type="number" bind:value={$settings.previewZoom} />
      <InputGroupText>%</InputGroupText>
      <InputGroupText class="p-0">
        <Button color="link" on:click={() => ($settings.previewZoom += 10)}>
          <Icon name="zoom-in" />
        </Button>
      </InputGroupText>
    </InputGroup>
  </div>

  {#if card}
    <div class="current-card">
      <div
        class="card-stage"
        style="
          width: {$pageLayout.cardSize.width * ($settings.previewZoom / 100)}mm;
          height: {$pageLayout.cardSize.height * ($settings.previewZoom / 100)}mm;
        "
      >
        <div style="transform: scale({$settings.previewZoom / 100}); transform-origin: top left;">
          <CardComponent {card} />
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .canvas {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    background:
      radial-gradient(circle at top, rgba(255, 255, 255, 0.9), rgba(244, 241, 231, 0.96)),
      linear-gradient(90deg, rgba(24, 32, 47, 0.04) 1px, transparent 1px),
      linear-gradient(rgba(24, 32, 47, 0.04) 1px, transparent 1px);
    background-size: auto, 32px 32px, 32px 32px;
    background-position: 0 0, center center, center center;
  }

  .zoom-input {
    position: sticky;
    top: 1rem;
    left: 1rem;
    z-index: 2;
    margin: 1rem;
    width: 13em;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 0.75rem;
  }

  .current-card {
    display: flex;
    min-height: calc(100% - 5rem);
    padding: 2rem;
    align-items: center;
    justify-content: center;
  }

  .card-stage {
    flex: none;
    filter: drop-shadow(0 1.25rem 2.5rem rgba(24, 32, 47, 0.18));
  }

  @media (max-width: 1100px) {
    .canvas {
      min-height: 70vh;
      border-radius: 1rem;
    }

    .current-card {
      min-height: calc(70vh - 5rem);
    }
  }
</style>
