<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, tick } from 'svelte';
  import {
    getMapPrintSize,
    getPixelsPerSquare,
    getRectCropOffset,
    getRectPrintSize
  } from '$lib/battlemap';
  import { battlemapProject } from '../../../stores/battlemap';

  let outputReady = false;

  $: project = $battlemapProject;
  $: pixelsPerSquare = getPixelsPerSquare(project);
  $: mapPrintSize = getMapPrintSize(project.imageSize, pixelsPerSquare);
  $: hasPrintableOutput = project.imageSrc && pixelsPerSquare > 0 && project.pages.length > 0;

  const notifyReady = async () => {
    if (!browser) {
      return;
    }

    await tick();
    outputReady = true;

    requestAnimationFrame(() => {
      if (window.parent !== window) {
        const previewToken = new URL(window.location.href).searchParams.get('preview') ?? '';
        window.parent.postMessage(
          {
            type: 'rpg-cards-map-output-ready',
            previewToken
          },
          window.location.origin
        );
      }
    });
  };

  onMount(() => {
    void notifyReady();
  });

  $: if (browser && hasPrintableOutput) {
    void notifyReady();
  }
</script>

{#if hasPrintableOutput}
  <div
    class:map-output-visible={outputReady}
    class="map-output"
    style={`
      --paper-width: ${project.print.paperSize.width}mm;
      --paper-height: ${project.print.paperSize.height}mm;
      --margin-top: ${project.print.margins.top}mm;
      --margin-right: ${project.print.margins.right}mm;
      --margin-bottom: ${project.print.margins.bottom}mm;
      --margin-left: ${project.print.margins.left}mm;
      --adjust-x: ${project.print.adjust.x || 0}mm;
      --adjust-y: ${project.print.adjust.y || 0}mm;
      --map-width: ${mapPrintSize.width}mm;
      --map-height: ${mapPrintSize.height}mm;
    `}
  >
    {#each project.pages as page}
      {@const rectSize = getRectPrintSize(page, pixelsPerSquare)}
      {@const cropOffset = getRectCropOffset(page, pixelsPerSquare)}
      <section class="map-paper">
        <div
          class:map-page-grid-light={project.print.gridOverlay === 'light'}
          class:map-page-grid-dark={project.print.gridOverlay === 'dark'}
          class:map-page-crop-marks={project.print.showCropMarks}
          class="map-page-clip"
          style={`
            width: ${rectSize.width}mm;
            height: ${rectSize.height}mm;
          `}
        >
          <img
            class="map-page-image"
            src={project.imageSrc}
            alt={page.name}
            style={`
              width: var(--map-width);
              height: var(--map-height);
              transform: translate(${cropOffset.x}mm, ${cropOffset.y}mm);
            `}
          />
        </div>
      </section>
      <div style="break-after:page"></div>
    {/each}
  </div>
{:else}
  <div class="map-output-empty" aria-live="polite">
    <p>Load, calibrate, and create at least one page before printing.</p>
  </div>
{/if}

<style lang="scss">
  :global(html),
  :global(body) {
    min-height: 100%;
    overflow: auto;
    background: transparent;
  }

  .map-output {
    opacity: 0;
    transition: opacity 160ms ease;
  }

  .map-output-visible {
    opacity: 1;
  }

  .map-paper {
    position: relative;
    width: var(--paper-width);
    height: var(--paper-height);
    padding-top: calc(var(--margin-top) - var(--adjust-y));
    padding-right: var(--margin-right);
    padding-bottom: var(--margin-bottom);
    padding-left: calc(var(--margin-left) - var(--adjust-x));
    overflow: hidden;
    background: white;

    @media screen {
      margin: 1em;
      border: 2px dashed silver;
      box-shadow: 0 12px 28px rgba(18, 38, 63, 0.12);
    }
  }

  .map-page-clip {
    position: relative;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    background-color: white;
  }

  .map-page-crop-marks {
    outline: 0.18mm solid rgba(0, 0, 0, 0.28);
    outline-offset: -0.18mm;
  }

  .map-page-image {
    position: absolute;
    inset: 0 auto auto 0;
    display: block;
    max-width: none;
    max-height: none;
    transform-origin: top left;
    user-select: none;
  }

  .map-page-grid-light::after,
  .map-page-grid-dark::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, var(--grid-color) 0.2mm, transparent 0.2mm),
      linear-gradient(to bottom, var(--grid-color) 0.2mm, transparent 0.2mm);
    background-size: 25.4mm 25.4mm;
  }

  .map-page-grid-light::after {
    --grid-color: rgba(255, 255, 255, 0.48);
  }

  .map-page-grid-dark::after {
    --grid-color: rgba(0, 0, 0, 0.28);
  }

  .map-output-empty {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 2rem;
    background: #edf1f6;
    color: #475569;
    font-weight: 700;
    text-align: center;
  }

  @media print {
    .map-paper {
      margin: 0;
      border: 0;
      box-shadow: none;
    }
  }
</style>
