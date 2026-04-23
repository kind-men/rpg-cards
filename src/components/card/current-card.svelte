<script lang="ts">
  import { afterUpdate, tick } from 'svelte';
  import { settings } from '../../stores/settings';
  import { Button, Icon, Input, InputGroup, InputGroupText, Tooltip } from 'sveltestrap';
  import { currentCard, deck, pageLayout } from '../../stores';
  import CardComponent from './card.svelte';
  import CardBack from './card-back.svelte';

  let frontStageElement: HTMLDivElement;
  let hasContentOverflow = false;
  const overflowWarningId = 'card-overflow-warning';

  $: card = $deck[$currentCard];

  const updateOverflowState = async () => {
    await tick();

    const contentElement = frontStageElement?.querySelector('.card-content') as HTMLElement;
    if (!contentElement) {
      hasContentOverflow = false;
      return;
    }

    const children = Array.from(contentElement.children) as HTMLElement[];
    const childOverflow = children.some(
      (child) => child.offsetTop + child.offsetHeight > contentElement.clientHeight + 1
    );

    hasContentOverflow = childOverflow;
  };

  afterUpdate(() => {
    void updateOverflowState();
  });
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
      <div class="card-preview-row">
        <div
          class="card-stage"
          bind:this={frontStageElement}
          style="
            width: {$pageLayout.cardSize.width * ($settings.previewZoom / 100)}mm;
            height: {$pageLayout.cardSize.height * ($settings.previewZoom / 100)}mm;
          "
        >
          <div style="transform: scale({$settings.previewZoom / 100}); transform-origin: top left;">
            <CardComponent {card} />
          </div>
          {#if hasContentOverflow}
            <div class="card-overflow-warning" id={overflowWarningId}>
              <Icon name="exclamation-triangle-fill" />
            </div>
            <Tooltip target={overflowWarningId} placement="left">
              Some content is clipped and does not fit on this card.
            </Tooltip>
          {/if}
        </div>
        <div
          class="card-stage"
          style="
            width: {$pageLayout.cardSize.width * ($settings.previewZoom / 100)}mm;
            height: {$pageLayout.cardSize.height * ($settings.previewZoom / 100)}mm;
          "
        >
          <div style="transform: scale({$settings.previewZoom / 100}); transform-origin: top left;">
            <CardBack {card} />
          </div>
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
    position: relative;
    flex: none;
    filter: drop-shadow(0 1.25rem 2.5rem rgba(24, 32, 47, 0.18));
  }

  .card-preview-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  }

  .card-overflow-warning {
    position: absolute;
    right: 0.45rem;
    bottom: 0.45rem;
    z-index: 2;
    width: 1.5rem;
    height: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(255, 242, 184, 0.96);
    color: #9a6b00;
    box-shadow: 0 0.25rem 0.8rem rgba(24, 32, 47, 0.16);
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
