<script lang="ts">
  import 'ress/dist/ress.min.css';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Icon, Input, InputGroup, InputGroupText, Label } from '@sveltestrap/sveltestrap';
  import { onDestroy } from 'svelte';
  import BattlemapPrintSidebar from '$components/battlemap-print-sidebar.svelte';
  import WorkspaceContentView from '$components/workspace-content-view.svelte';
  import WorkspaceShell from '$components/workspace-shell.svelte';
  import { PAPER_SIZE_PRESETS } from '../../../stores/page-layout';
  import type { BattlemapPageOrientation } from '$model/battlemap';
  import type { PaperFormat } from '$model/page-layout';
  import { battlemapProject } from '../../../stores/battlemap';

  type BattlemapPrintWindow = Window & {
    __rpgCardsMapPrintProjects?: Record<string, string>;
  };

  let previewFrame: HTMLIFrameElement | undefined;
  let previewNonce = 0;
  let previewLoading = true;
  let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

  const paperFormatOptions: { value: PaperFormat; label: string }[] = [
    { value: 'a4', label: 'A4' },
    { value: 'letter', label: 'Letter' },
    { value: 'legal', label: 'Legal' },
    { value: 'a3', label: 'A3' },
    { value: 'a5', label: 'A5' },
    { value: 'custom', label: 'Custom' }
  ];

  const queuePreviewRefresh = () => {
    if (!browser) {
      return;
    }

    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    refreshTimeout = setTimeout(() => {
      const nextPreviewNonce = previewNonce + 1;
      const snapshot = JSON.stringify($battlemapProject);
      const printWindow = window as BattlemapPrintWindow;

      printWindow.__rpgCardsMapPrintProjects ??= {};
      printWindow.__rpgCardsMapPrintProjects[String(nextPreviewNonce)] = snapshot;

      try {
        sessionStorage.setItem(`rpg-cards-map-print-project:${nextPreviewNonce}`, snapshot);
      } catch (error) {
        console.warn('Unable to write battlemap print preview snapshot fallback.', error);
      }

      previewLoading = true;
      previewNonce = nextPreviewNonce;
      refreshTimeout = undefined;
    }, 100);
  };

  $: if (browser) {
    $battlemapProject;
    queuePreviewRefresh();
  }

  const handlePrint = () => {
    previewFrame?.contentWindow?.focus();
    previewFrame?.contentWindow?.print();
  };

  const handlePreviewLoad = () => {
    window.setTimeout(() => {
      if (previewLoading) {
        previewLoading = false;
      }
    }, 1200);
  };

  const handlePaperFormatChange = (event: Event) => {
    const paperFormat = (event.currentTarget as HTMLSelectElement).value as PaperFormat;

    battlemapProject.update((project) => ({
      ...project,
      print: {
        ...project.print,
        paperFormat,
        paperSize:
          paperFormat === 'custom' ? { ...project.print.paperSize } : { ...PAPER_SIZE_PRESETS[paperFormat] }
      }
    }));
  };

  const handleOrientationChange = (event: Event) => {
    const orientation = (event.currentTarget as HTMLSelectElement).value as BattlemapPageOrientation;

    battlemapProject.update((project) => ({
      ...project,
      print: {
        ...project.print,
        orientation
      }
    }));
  };

  const setPrintNumber = (
    path: 'adjust-x' | 'adjust-y' | 'paper-width' | 'paper-height',
    event: Event
  ) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);

    battlemapProject.update((project) => {
      if (path === 'paper-width' || path === 'paper-height') {
        return {
          ...project,
          print: {
            ...project.print,
            paperFormat: 'custom',
            paperSize: {
              ...project.print.paperSize,
              [path === 'paper-width' ? 'width' : 'height']: value
            }
          }
        };
      }

      if (path === 'adjust-x' || path === 'adjust-y') {
        return {
          ...project,
          print: {
            ...project.print,
            adjust: {
              ...project.print.adjust,
              [path === 'adjust-x' ? 'x' : 'y']: value
            }
          }
        };
      }

      return project;
    });
  };

  const closePrintView = async () => {
    await goto(`${base}/map`);
  };

  const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.code === 'KeyP') {
      event.preventDefault();
      handlePrint();
    }
  };

  const handlePreviewMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      return;
    }

    if (
      event.data?.type === 'rpg-cards-map-output-ready' &&
      String(event.data?.previewToken ?? '') === String(previewNonce)
    ) {
      previewLoading = false;
    }
  };

  onDestroy(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
  });
</script>

<svelte:window on:keydown={handleWindowKeydown} on:message={handlePreviewMessage} />

<WorkspaceShell view="print" workspaceMode="battlemaps" contentMaxWidth="100%">
  <BattlemapPrintSidebar slot="leftSidebar" />
  <WorkspaceContentView>
    <section class="map-print-view">
      <section class="map-print-settings-card">
        <button class="map-close-button" type="button" aria-label="Close print preview" on:click={closePrintView}>
          <Icon name="x-lg" />
        </button>
        <div class="map-print-toolbar-copy">
          <h1>Print Battlemap</h1>
          <p>Review true-scale map pages, adjust paper settings, and print when ready.</p>
        </div>
        <div class="map-print-settings-grid">
          <div class="map-print-setting-group">
            <Label for="map-paper-size">Paper size</Label>
            <Input id="map-paper-size" type="select" value={$battlemapProject.print.paperFormat} on:change={handlePaperFormatChange}>
              {#each paperFormatOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </Input>
          </div>

          <div class="map-print-setting-group">
            <Label for="map-paper-orientation">Orientation</Label>
            <Input
              id="map-paper-orientation"
              type="select"
              value={$battlemapProject.print.orientation}
              on:change={handleOrientationChange}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </Input>
          </div>

          {#if $battlemapProject.print.paperFormat === 'custom'}
        <div class="map-print-setting-group">
          <Label for="map-custom-paper-width">Custom paper</Label>
          <div class="map-print-setting-pair">
            <InputGroup>
              <Input
                id="map-custom-paper-width"
                placeholder="Width"
                type="number"
                value={$battlemapProject.print.paperSize.width}
                on:input={(event) => setPrintNumber('paper-width', event)}
              />
              <InputGroupText>mm</InputGroupText>
            </InputGroup>
            <InputGroup>
              <Input
                id="map-custom-paper-height"
                placeholder="Height"
                type="number"
                value={$battlemapProject.print.paperSize.height}
                on:input={(event) => setPrintNumber('paper-height', event)}
              />
              <InputGroupText>mm</InputGroupText>
            </InputGroup>
          </div>
        </div>
          {/if}

          <div class="map-print-setting-group">
            <Label for="map-print-adjust-x">Print adjust</Label>
            <div class="map-print-setting-pair">
              <InputGroup>
                <Input
                  id="map-print-adjust-x"
                  placeholder="X"
                  type="number"
                  value={$battlemapProject.print.adjust.x}
                  on:input={(event) => setPrintNumber('adjust-x', event)}
                />
                <InputGroupText>mm</InputGroupText>
              </InputGroup>
              <InputGroup>
                <Input
                  id="map-print-adjust-y"
                  placeholder="Y"
                  type="number"
                  value={$battlemapProject.print.adjust.y}
                  on:input={(event) => setPrintNumber('adjust-y', event)}
                />
                <InputGroupText>mm</InputGroupText>
              </InputGroup>
            </div>
          </div>

          <div class="map-print-setting-group">
            <span class="map-print-spacer">Print</span>
            <button class="map-print-button" type="button" on:click={handlePrint}>
              <Icon name="printer" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </section>

      <div class="map-print-preview-frame-shell">
        {#if previewLoading}
          <div class="map-print-preview-loading" aria-live="polite">
            <div class="map-print-preview-spinner" aria-hidden="true"></div>
            <p>Building map preview</p>
          </div>
        {/if}
        <iframe
          bind:this={previewFrame}
          class:map-print-preview-frame-ready={!previewLoading}
          class="map-print-preview-frame"
          title="Battlemap print preview"
          src={`${base}/map/output?preview=${previewNonce}`}
          on:load={handlePreviewLoad}
        ></iframe>
      </div>
    </section>
  </WorkspaceContentView>
</WorkspaceShell>

<style lang="scss">
  .map-print-view {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 1rem;
    min-height: calc(100dvh - 3rem);
    height: calc(100dvh - 3rem);
  }

  .map-print-settings-card {
    position: relative;
    display: grid;
    gap: 1rem;
    padding: 1rem 1.25rem 1.2rem;
    border: 1px solid var(--color-border-soft);
    border-radius: 0.25rem;
    background: color-mix(in srgb, var(--color-surface-base) 92%, white);
    box-shadow: 0 18px 40px var(--color-shadow-200);
    backdrop-filter: blur(10px);
  }

  .map-close-button {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 999px;
    background: var(--color-overlay-muted);
    color: var(--color-ink-600);
  }

  .map-print-toolbar-copy {
    padding-right: 2.75rem;
  }

  .map-print-toolbar-copy h1 {
    margin: 0;
    color: var(--color-ink-950);
    font-family: 'Overpass', sans-serif;
    font-size: clamp(1.5rem, 2.5vw, 2.1rem);
    font-weight: 800;
    line-height: 1;
  }

  .map-print-toolbar-copy p {
    margin: 0.45rem 0 0;
    color: var(--color-ink-700);
  }

  .map-print-settings-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem 1.25rem;
    align-items: start;
  }

  .map-print-setting-group {
    display: grid;
    gap: 0.45rem;
  }

  .map-print-setting-group :global(.col-form-label),
  .map-print-setting-group :global(.form-control),
  .map-print-setting-group :global(.input-group-text),
  .map-print-setting-group :global(select),
  .map-print-setting-group :global(input) {
    font-size: var(--editor-form-font-size);
  }

  .map-print-setting-pair {
    display: grid;
    gap: 0.5rem;
  }

  .map-print-setting-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-print-spacer {
    opacity: 0;
  }

  .map-print-button {
    min-height: 2.2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    border: 1px solid var(--color-border-soft);
    border-radius: 0.75rem;
    background: var(--color-brand-primary);
    color: white;
    font-weight: 700;
  }

  .map-print-preview-frame-shell {
    position: relative;
    display: grid;
    min-height: 0;
    height: 100%;
    border: 1px solid var(--color-border-soft);
    border-radius: 0.25rem;
    overflow: hidden;
    background: var(--color-surface-base);
    box-shadow: 0 16px 36px var(--color-shadow-200);
  }

  .map-print-preview-frame {
    width: 100%;
    height: 100%;
    border: 0;
    background: white;
    opacity: 0;
    transition: opacity 140ms ease;
  }

  .map-print-preview-frame-ready {
    opacity: 1;
  }

  .map-print-preview-loading {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
    place-items: center;
    gap: 0.85rem;
    padding: 1.5rem;
    background: color-mix(in srgb, var(--color-surface-base) 94%, white);
    color: var(--color-ink-700);
    font-weight: 700;
  }

  .map-print-preview-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid color-mix(in srgb, var(--color-border-soft) 70%, transparent);
    border-top-color: var(--color-ink-700);
    border-radius: 999px;
    animation: map-print-preview-spin 900ms linear infinite;
  }

  @keyframes map-print-preview-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 950px) {
    .map-print-view {
      height: auto;
    }

    .map-print-settings-grid,
    .map-print-setting-pair {
      grid-template-columns: 1fr;
    }

    .map-print-preview-frame {
      min-height: 70vh;
    }
  }
</style>
