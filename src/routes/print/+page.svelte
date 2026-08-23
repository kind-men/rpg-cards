<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Icon, Input, InputGroup, InputGroupText } from '@sveltestrap/sveltestrap';
  import { onDestroy, onMount } from 'svelte';
  import WorkspaceContentView from '$components/workspace-content-view.svelte';
  import WorkspaceShell from '$components/workspace-shell.svelte';
  import { deck, deckLoading, pageLayout } from '../../stores';
  import Hint from '../../components/hint.svelte';
  import type { PaperFormat } from '../../model/page-layout';
  import { PAPER_SIZE_PRESETS } from '../../stores/page-layout';

  let previewFrame: HTMLIFrameElement | undefined;
  let previewNonce = 0;
  let previewLoading = true;
  let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
  let initialDeckSize: number | undefined;
  let isLeavingForNewCards = false;
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

      try {
        sessionStorage.setItem(`rpg-cards-print-deck:${nextPreviewNonce}`, JSON.stringify($deck));
      } catch (error) {
        console.warn('Unable to write print preview deck snapshot.', error);
      }

      previewLoading = true;
      previewNonce = nextPreviewNonce;
      refreshTimeout = undefined;
    }, 100);
  };

  $: if (browser) {
    $deck;
    $pageLayout;
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

    pageLayout.update((layout) => ({
      ...layout,
      paperFormat,
      paperSize:
        paperFormat === 'custom' ? { ...layout.paperSize } : { ...PAPER_SIZE_PRESETS[paperFormat] }
    }));
  };

  const closePrintView = async () => {
    await goto(`${base}/`);
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
      event.data?.type === 'rpg-cards-output-ready' &&
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

  onMount(() => {
    void (async () => {
      await deck.loadStoredDeck();
      initialDeckSize = $deck.length;
    })();
  });

  $: if (
    browser &&
    !isLeavingForNewCards &&
    !($deckLoading ?? false) &&
    initialDeckSize !== undefined &&
    $deck.length > initialDeckSize
  ) {
    isLeavingForNewCards = true;
    void goto(`${base}/`);
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} on:message={handlePreviewMessage} />

<WorkspaceShell view="print" contentMaxWidth="100%">
  <WorkspaceContentView>
    <section class="print-view">
      <section class="print-settings-card">
        <button class="docs-close-button" type="button" aria-label="Close print preview" on:click={closePrintView}>
          <Icon name="x-lg" />
        </button>
        <div class="print-toolbar-copy">
          <h1 class="print-toolbar-title">Print</h1>
          <p class="print-toolbar-text">
            Review the layout here, adjust the print settings below, and print when you are ready.
          </p>
        </div>
        <div class="print-settings-form">
          <div class="print-settings-grid">
            <div class="print-setting-group">
              <label class="print-setting-label" for="print-paper-size">Paper size</label>
              <Input
                id="print-paper-size"
                type="select"
                value={$pageLayout.paperFormat}
                on:change={handlePaperFormatChange}
              >
                {#each paperFormatOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </Input>
            </div>

            {#if $pageLayout.paperFormat === 'custom'}
              <div class="print-setting-group">
                <label class="print-setting-label" for="print-paper-size-width">Custom paper size</label>
                <div class="print-setting-pair">
                  <InputGroup>
                    <Input
                      id="print-paper-size-width"
                      placeholder="Width"
                      type="number"
                      bind:value={$pageLayout.paperSize.width}
                    />
                    <InputGroupText>mm</InputGroupText>
                  </InputGroup>
                  <InputGroup>
                    <Input
                      id="print-paper-size-height"
                      placeholder="Height"
                      type="number"
                      bind:value={$pageLayout.paperSize.height}
                    />
                    <InputGroupText>mm</InputGroupText>
                  </InputGroup>
                </div>
              </div>
            {/if}

            <div class="print-setting-group">
              <div class="print-setting-label-row">
                <label class="print-setting-label" for="print-adjust">Print adjust</label>
                <Hint id="print-adjust-help">
                  Use this to adjust the print in order to make up for difference in printers
                </Hint>
              </div>
              <div class="print-setting-pair" id="print-adjust">
                <InputGroup>
                  <Input
                    id="print-adjust-x"
                    placeholder="X"
                    type="number"
                    bind:value={$pageLayout.adjust.x}
                  />
                  <InputGroupText>mm</InputGroupText>
                </InputGroup>
                <InputGroup>
                  <Input
                    id="print-adjust-y"
                    placeholder="Y"
                    type="number"
                    bind:value={$pageLayout.adjust.y}
                  />
                  <InputGroupText>mm</InputGroupText>
                </InputGroup>
              </div>
            </div>

            <div class="print-setting-group">
              <div class="print-setting-label-row">
                <label class="print-setting-label" for="print-card-back-border">Cardback border</label>
                <Hint id="print-cardback-border-help">
                  Use this add a colored border around the back of the cards when printing to make up
                  for printing variances.
                </Hint>
              </div>
              <InputGroup id="print-card-back-border">
                <Input
                  id="print-card-back-border-input"
                  placeholder="Cardback border"
                  type="number"
                  bind:value={$pageLayout.cardBackBorder}
                />
                <InputGroupText>mm</InputGroupText>
              </InputGroup>
            </div>

            <div class="print-setting-group">
              <span class="print-setting-label print-setting-label-spacer">Print</span>
              <button class="docs-button print-toolbar-button" type="button" on:click={handlePrint}>
                <Icon name="printer" />
                <span>Print</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      <div class="print-preview-frame-shell">
        {#if previewLoading}
          <div class="print-preview-loading" aria-live="polite">
            <div class="print-preview-spinner" aria-hidden="true"></div>
            <p class="print-preview-loading-text">Building print preview…</p>
          </div>
        {/if}
        <iframe
          bind:this={previewFrame}
          class="print-preview-frame"
          class:print-preview-frame-ready={!previewLoading}
          title="Print preview"
          src={`${base}/output?preview=${previewNonce}`}
          on:load={handlePreviewLoad}
        ></iframe>
      </div>
    </section>
  </WorkspaceContentView>
</WorkspaceShell>

<style lang="scss">
  .print-view {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 1rem;
    min-height: calc(100dvh - 3rem);
    height: calc(100dvh - 3rem);
  }

  .print-settings-card {
    position: sticky;
    top: 0;
    z-index: 2;
    display: grid;
    gap: 1rem;
    padding: 1rem 1.25rem 1.2rem;
    border: 1px solid var(--color-border-soft);
    border-radius: 0.25rem;
    background: color-mix(in srgb, var(--color-surface-base) 92%, white);
    box-shadow: 0 18px 40px var(--color-shadow-200);
    backdrop-filter: blur(10px);
  }

  .print-toolbar-copy {
    min-width: 0;
    padding-right: 2.75rem;
  }

  .print-toolbar-title {
    margin: 0;
    color: var(--color-ink-950);
    font-family: 'Overpass', sans-serif;
    font-size: clamp(1.5rem, 2.5vw, 2.1rem);
    font-weight: 800;
    line-height: 1;
  }

  .print-toolbar-text {
    margin: 0.45rem 0 0;
    color: var(--color-ink-700);
    line-height: 1.5;
  }

  .print-toolbar-button {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    justify-content: center;
    white-space: nowrap;
    width: 100%;
  }

  .print-preview-frame-shell {
    position: relative;
    display: grid;
    min-height: 0;
    height: 100%;
    border: 1px solid var(--color-border-soft);
    border-radius: 0.25rem;
    overflow: hidden;
    background:
      radial-gradient(circle at top, var(--color-white-80), var(--color-white-0) 38%),
      var(--color-surface-panel);
    box-shadow: 0 16px 36px var(--color-shadow-200);
  }

  .print-preview-frame {
    width: 100%;
    height: 100%;
    border: 0;
    background: white;
    opacity: 0;
    transition: opacity 140ms ease;
  }

  .print-preview-frame-ready {
    opacity: 1;
  }

  .print-preview-loading {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
    place-items: center;
    gap: 0.85rem;
    padding: 1.5rem;
    background:
      radial-gradient(circle at top, var(--color-white-80), var(--color-white-0) 42%),
      color-mix(in srgb, var(--color-surface-base) 94%, white);
    text-align: center;
  }

  .print-preview-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid color-mix(in srgb, var(--color-border-soft) 70%, transparent);
    border-top-color: var(--color-ink-700);
    border-radius: 999px;
    animation: print-preview-spin 900ms linear infinite;
  }

  .print-preview-loading-text {
    margin: 0;
    color: var(--color-ink-700);
    font-weight: 600;
  }

  .print-settings-form {
    display: grid;
    gap: 0.9rem;
  }

  .print-settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 1.25rem;
    align-items: start;
  }

  .print-setting-group {
    display: grid;
    gap: 0.45rem;
  }

  .print-setting-label-row {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .print-setting-label {
    margin: 0;
    color: var(--color-ink-900);
    font-weight: 700;
  }

  .print-setting-label-spacer {
    opacity: 0;
    pointer-events: none;
    user-select: none;
  }

  .print-setting-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 780px) {
    .print-settings-card {
      padding-top: 3rem;
    }

    .print-toolbar-copy {
      padding-right: 0;
    }

    .print-settings-grid,
    .print-setting-pair {
      grid-template-columns: 1fr;
    }

    .print-preview-frame {
      min-height: 0;
    }
  }

  @keyframes print-preview-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
