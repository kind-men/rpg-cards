<script lang="ts">
  import 'ress/dist/ress.min.css';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { Icon, Input, InputGroup, InputGroupText, Label } from '@sveltestrap/sveltestrap';
  import { get } from 'svelte/store';
  import {
    clampRectToImage,
    createAutoBattlemapPages,
    getPixelsPerSquare,
    getPrintablePaperSizePixels,
    getRectPrintSize,
    normalizeBattlemapProject,
    snapToGrid
  } from '$lib/battlemap';
  import type { BattlemapPoint, BattlemapRect } from '$model/battlemap';
  import { battlemapProject } from '../../stores/battlemap';

  type CalibrationPoint = 'start' | 'end';

  let imageFileSelector: HTMLInputElement;
  let projectFileSelector: HTMLInputElement;
  let hiddenDownloadLink: HTMLAnchorElement;
  let mapStageElement: HTMLDivElement;
  let mapScrollShellElement: HTMLDivElement;
  let downloadUrl = '';
  let pendingCalibrationPoint: CalibrationPoint | undefined;
  let selectedPageId = '';
  let zoom = 35;
  let panOffset: BattlemapPoint = { x: 24, y: 24 };
  let projectWarning = '';
  let generalMenuOpen = false;
  let didPan = false;
  let drag:
    | {
        type: 'move' | 'resize';
        pageId: string;
        startClient: BattlemapPoint;
        startRect: BattlemapRect;
      }
    | undefined;
  let pan:
    | {
        startClient: BattlemapPoint;
        startOffset: BattlemapPoint;
      }
    | undefined;

  $: project = $battlemapProject;
  $: pixelsPerSquare = getPixelsPerSquare(project);
  $: isCalibrated = pixelsPerSquare > 0;
  $: selectedPage = project.pages.find((page) => page.id === selectedPageId);
  $: printablePageSize = getPrintablePaperSizePixels(project.print, pixelsPerSquare);

  const getStageImagePoint = (event: PointerEvent | MouseEvent): BattlemapPoint | null => {
    if (!mapStageElement || !project.imageSize.width || !project.imageSize.height) {
      return null;
    }

    const rect = mapStageElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * project.imageSize.width;
    const y = ((event.clientY - rect.top) / rect.height) * project.imageSize.height;

    return {
      x: Math.min(Math.max(x, 0), project.imageSize.width),
      y: Math.min(Math.max(y, 0), project.imageSize.height)
    };
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const loadImageSize = (src: string) =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Unable to load image.'));
      image.src = src;
    });

  const handleImageChange = async (event: Event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    const imageSrc = await readFileAsDataUrl(file);
    const imageSize = await loadImageSize(imageSrc);

    battlemapProject.update((current) => ({
      ...current,
      name: file.name.replace(/\.[^.]+$/, '') || current.name,
      imageSrc,
      imageSize,
      calibration: {
        squareCount: 1
      },
      pages: []
    }));

    selectedPageId = '';
    pendingCalibrationPoint = undefined;
    panOffset = { x: 24, y: 24 };
    imageFileSelector.value = '';
  };

  const handleProjectImport = async (event: Event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const imported = normalizeBattlemapProject(JSON.parse(text));
    battlemapProject.set(imported);
    selectedPageId = imported.pages[0]?.id ?? '';
    projectWarning = '';
    projectFileSelector.value = '';
  };

  const handleExportProject = () => {
    const json = JSON.stringify(get(battlemapProject), undefined, 2);
    const blob = new Blob([json], { type: 'application/json' });

    if (json.length > 4_000_000) {
      projectWarning = 'This project file is large because it includes the source image.';
    } else {
      projectWarning = '';
    }

    downloadUrl = URL.createObjectURL(blob);
    hiddenDownloadLink.href = downloadUrl;
    hiddenDownloadLink.download = `${project.name || 'battlemap'}.battlemap.json`;
    hiddenDownloadLink.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 500);
  };

  const handleMapClick = (event: MouseEvent) => {
    if (didPan) {
      didPan = false;
      return;
    }

    if (!pendingCalibrationPoint) {
      return;
    }

    const point = getStageImagePoint(event);
    if (!point) {
      return;
    }

    const pointKey = pendingCalibrationPoint;
    battlemapProject.update((current) => ({
      ...current,
      calibration: {
        ...current.calibration,
        [pointKey]: point,
        gridOrigin: current.calibration.gridOrigin ?? point
      }
    }));

    pendingCalibrationPoint = undefined;
  };

  const handleMapKeydown = (event: KeyboardEvent) => {
    if (!pendingCalibrationPoint || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    event.preventDefault();
    const fallbackPoint = {
      x: project.imageSize.width / 2,
      y: project.imageSize.height / 2
    };
    const pointKey = pendingCalibrationPoint;

    battlemapProject.update((current) => ({
      ...current,
      calibration: {
        ...current.calibration,
        [pointKey]: fallbackPoint,
        gridOrigin: current.calibration.gridOrigin ?? fallbackPoint
      }
    }));

    pendingCalibrationPoint = undefined;
  };

  const addPage = () => {
    if (!project.imageSize.width || !project.imageSize.height) {
      return;
    }

    const fallbackSize = isCalibrated
      ? printablePageSize
      : {
          width: project.imageSize.width / 2,
          height: project.imageSize.height / 2
        };
    const nextPage = clampRectToImage(
      {
        id: crypto.randomUUID(),
        name: `Page ${project.pages.length + 1}`,
        x: 0,
        y: 0,
        width: Math.min(fallbackSize.width || 400, project.imageSize.width),
        height: Math.min(fallbackSize.height || 400, project.imageSize.height)
      },
      project.imageSize
    );

    battlemapProject.update((current) => ({
      ...current,
      pages: [...current.pages, nextPage]
    }));
    selectedPageId = nextPage.id;
  };

  const generatePages = () => {
    const pages = createAutoBattlemapPages(project);
    battlemapProject.update((current) => ({
      ...current,
      pages
    }));
    selectedPageId = pages[0]?.id ?? '';
  };

  const removeSelectedPage = () => {
    if (!selectedPageId) {
      return;
    }

    battlemapProject.update((current) => ({
      ...current,
      pages: current.pages.filter((page) => page.id !== selectedPageId)
    }));
    selectedPageId = '';
  };

  const updateSelectedPage = (patch: Partial<BattlemapRect>) => {
    if (!selectedPageId) {
      return;
    }

    battlemapProject.update((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === selectedPageId
          ? clampRectToImage({ ...page, ...patch }, current.imageSize)
          : page
      )
    }));
  };

  const startPageDrag = (event: PointerEvent, page: BattlemapRect, type: 'move' | 'resize') => {
    event.preventDefault();
    event.stopPropagation();
    selectedPageId = page.id;
    drag = {
      type,
      pageId: page.id,
      startClient: {
        x: event.clientX,
        y: event.clientY
      },
      startRect: { ...page }
    };
  };

  const handleWindowPointerMove = (event: PointerEvent) => {
    if (pan && mapScrollShellElement) {
      const dx = event.clientX - pan.startClient.x;
      const dy = event.clientY - pan.startClient.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        didPan = true;
      }
      panOffset = {
        x: pan.startOffset.x + dx,
        y: pan.startOffset.y + dy
      };
      return;
    }

    if (!drag || !mapStageElement) {
      return;
    }

    const rect = mapStageElement.getBoundingClientRect();
    const dx = ((event.clientX - drag.startClient.x) / rect.width) * project.imageSize.width;
    const dy = ((event.clientY - drag.startClient.y) / rect.height) * project.imageSize.height;
    const page = project.pages.find((candidate) => candidate.id === drag?.pageId);

    if (!page) {
      drag = undefined;
      return;
    }

    const nextRect =
      drag.type === 'move'
        ? {
            ...drag.startRect,
            x: drag.startRect.x + dx,
            y: drag.startRect.y + dy
          }
        : {
            ...drag.startRect,
            width: drag.startRect.width + dx,
            height: drag.startRect.height + dy
          };

    const snappedRect =
      project.print.snapToGrid && pixelsPerSquare > 0
        ? {
            ...nextRect,
            x: snapToGrid(nextRect.x, pixelsPerSquare),
            y: snapToGrid(nextRect.y, pixelsPerSquare),
            width: snapToGrid(nextRect.width, pixelsPerSquare),
            height: snapToGrid(nextRect.height, pixelsPerSquare)
          }
        : nextRect;

    battlemapProject.update((current) => ({
      ...current,
      pages: current.pages.map((candidate) =>
        candidate.id === drag?.pageId
          ? clampRectToImage(snappedRect, current.imageSize, Math.max(20, pixelsPerSquare || 20))
          : candidate
      )
    }));
  };

  const stopDrag = () => {
    drag = undefined;
    pan = undefined;
  };

  const startMapPan = (event: PointerEvent) => {
    if (pendingCalibrationPoint || event.button !== 0) {
      return;
    }

    event.preventDefault();
    pan = {
      startClient: {
        x: event.clientX,
        y: event.clientY
      },
      startOffset: {
        ...panOffset
      }
    };
    didPan = false;
  };

  const setZoomAroundViewportPoint = (nextZoom: number, clientX?: number, clientY?: number) => {
    if (!mapScrollShellElement || !mapStageElement) {
      zoom = Math.min(Math.max(nextZoom, 10), 300);
      return;
    }

    const clampedZoom = Math.min(Math.max(nextZoom, 10), 300);
    const shellRect = mapScrollShellElement.getBoundingClientRect();
    const anchorClientX = clientX ?? shellRect.left + shellRect.width / 2;
    const anchorClientY = clientY ?? shellRect.top + shellRect.height / 2;
    const anchorPoint = getStageImagePoint({
      clientX: anchorClientX,
      clientY: anchorClientY
    } as MouseEvent);

    zoom = clampedZoom;

    if (!anchorPoint || !project.imageSize.width || !project.imageSize.height) {
      return;
    }

    const nextScale = clampedZoom / 100;
    panOffset = {
      x: anchorClientX - shellRect.left - anchorPoint.x * nextScale,
      y: anchorClientY - shellRect.top - anchorPoint.y * nextScale
    };
  };

  const handleMapWheel = (event: WheelEvent) => {
    if (!project.imageSrc) {
      return;
    }

    event.preventDefault();
    const zoomDelta = event.deltaY < 0 ? 8 : -8;
    setZoomAroundViewportPoint(zoom + zoomDelta, event.clientX, event.clientY);
  };

  const setSnapToGrid = (event: Event) => {
    const snapToGrid = (event.currentTarget as HTMLInputElement).checked;
    battlemapProject.update((current) => ({
      ...current,
      print: {
        ...current.print,
        snapToGrid
      }
    }));
  };

  const handlePrint = async () => {
    generalMenuOpen = false;
    await goto(`${base}/map/print`);
  };

  const resetProject = () => {
    generalMenuOpen = false;
    battlemapProject.reset();
    selectedPageId = '';
    pendingCalibrationPoint = undefined;
    panOffset = { x: 24, y: 24 };
    projectWarning = '';
  };

  const toggleGeneralMenu = (event: MouseEvent) => {
    event.stopPropagation();
    generalMenuOpen = !generalMenuOpen;
  };

  const closeGeneralMenu = () => {
    generalMenuOpen = false;
  };

  const handleOpenProjectClick = () => {
    generalMenuOpen = false;
    projectFileSelector.click();
  };

  const handleSaveProjectClick = () => {
    generalMenuOpen = false;
    handleExportProject();
  };
</script>

<svelte:window on:click={closeGeneralMenu} on:pointermove={handleWindowPointerMove} on:pointerup={stopDrag} />

<div class="map-workspace">
  <nav class="map-mode-rail" aria-label="Workspace modes">
    <a class="map-mode-button" href={`${base}/`} aria-label="Cards">
      <Icon name="card-text" />
    </a>
    <a class="map-mode-button map-mode-button-active" href={`${base}/map`} aria-label="Battlemaps">
      <Icon name="map" />
    </a>
  </nav>

  <aside class="map-sidebar">
    <div class="map-menu-row">
      <div class="map-general-menu-popover" role="presentation" on:click|stopPropagation on:keydown|stopPropagation>
        <button
          class="map-general-menu-trigger"
          type="button"
          aria-label="Toggle battlemap actions menu"
          aria-expanded={generalMenuOpen}
          on:click={toggleGeneralMenu}
        >
          <img class="map-logo" src={`${base}/menu-logo.svg`} alt="" />
          <span class:map-general-menu-chevron-open={generalMenuOpen} class="map-general-menu-chevron"></span>
        </button>

        {#if generalMenuOpen}
          <div class="map-general-menu-panel">
            <button class="map-general-menu-item" type="button" on:click={resetProject}>
              New
            </button>
            <button class="map-general-menu-item" type="button" on:click={handleOpenProjectClick}>
              Open
            </button>
            <button class="map-general-menu-item" type="button" disabled={!project.imageSrc} on:click={handleSaveProjectClick}>
              Save
            </button>
            <div class="map-general-menu-divider"></div>
            <button class="map-general-menu-item" type="button" disabled={!isCalibrated || project.pages.length === 0} on:click={handlePrint}>
              Print
            </button>
          </div>
        {/if}
      </div>
    </div>

    <section class="map-panel">
      <div class="map-panel-header">
        <h1>Battlemaps</h1>
      </div>

      <div class="map-hidden">
        <input
          bind:this={imageFileSelector}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/*"
          on:change={handleImageChange}
        />
        <input bind:this={projectFileSelector} type="file" accept=".json" on:change={handleProjectImport} />
        <a bind:this={hiddenDownloadLink} href={downloadUrl}>Download project</a>
      </div>

      <div class="map-action-grid">
        <button type="button" class="map-button" on:click={() => imageFileSelector.click()}>
          <Icon name="image" />
          <span>Load image</span>
        </button>
      </div>

      {#if projectWarning}
        <p class="map-warning">{projectWarning}</p>
      {/if}
    </section>

    <section class="map-panel">
      <h2>Calibration</h2>
      <div class="map-form">
        <div class="map-action-grid">
          <button
            type="button"
            class:map-button-active={pendingCalibrationPoint === 'start'}
            class="map-button"
            disabled={!project.imageSrc}
            on:click={() => (pendingCalibrationPoint = 'start')}
          >
            <Icon name="crosshair" />
            <span>Point A</span>
          </button>
          <button
            type="button"
            class:map-button-active={pendingCalibrationPoint === 'end'}
            class="map-button"
            disabled={!project.imageSrc}
            on:click={() => (pendingCalibrationPoint = 'end')}
          >
            <Icon name="crosshair2" />
            <span>Point B</span>
          </button>
        </div>
        <div class="map-status">
          {#if isCalibrated}
            <strong>{pixelsPerSquare.toFixed(2)} px</strong> per 1 inch square
          {:else if project.imageSrc}
            Mark two adjacent grid intersections on the map.
          {:else}
            Load a map image to begin.
          {/if}
        </div>
      </div>
    </section>

    <section class="map-panel">
      <div class="map-panel-header">
        <h2>Pages</h2>
        <span class="map-count">{project.pages.length}</span>
      </div>
      <div class="map-form">
        <label class="map-toggle">
          <span>Snap to grid</span>
          <Input type="checkbox" checked={project.print.snapToGrid} on:change={setSnapToGrid} />
        </label>
        <div class="map-action-grid">
          <button type="button" class="map-button" disabled={!project.imageSrc} on:click={addPage}>
            <Icon name="plus-lg" />
            <span>Add page</span>
          </button>
          <button type="button" class="map-button" disabled={!isCalibrated} on:click={generatePages}>
            <Icon name="grid-3x3" />
            <span>Auto pages</span>
          </button>
        </div>
        <button type="button" class="map-button map-button-danger" disabled={!selectedPageId} on:click={removeSelectedPage}>
          <Icon name="trash" />
          <span>Delete selected</span>
        </button>

        {#if selectedPage}
          <div class="map-page-fields">
            <div class="map-field">
              <Label for="selected-page-name">Name</Label>
              <Input
                id="selected-page-name"
                value={selectedPage.name}
                on:input={(event) => updateSelectedPage({ name: event.currentTarget.value })}
              />
            </div>
            <div class="map-field-grid">
              <InputGroup>
                <InputGroupText>X</InputGroupText>
                <Input
                  type="number"
                  value={Math.round(selectedPage.x)}
                  on:input={(event) => updateSelectedPage({ x: Number(event.currentTarget.value) || 0 })}
                />
              </InputGroup>
              <InputGroup>
                <InputGroupText>Y</InputGroupText>
                <Input
                  type="number"
                  value={Math.round(selectedPage.y)}
                  on:input={(event) => updateSelectedPage({ y: Number(event.currentTarget.value) || 0 })}
                />
              </InputGroup>
              <InputGroup>
                <InputGroupText>W</InputGroupText>
                <Input
                  type="number"
                  value={Math.round(selectedPage.width)}
                  on:input={(event) => updateSelectedPage({ width: Number(event.currentTarget.value) || 1 })}
                />
              </InputGroup>
              <InputGroup>
                <InputGroupText>H</InputGroupText>
                <Input
                  type="number"
                  value={Math.round(selectedPage.height)}
                  on:input={(event) => updateSelectedPage({ height: Number(event.currentTarget.value) || 1 })}
                />
              </InputGroup>
            </div>
            {#if isCalibrated}
              <div class="map-status">
                Prints {getRectPrintSize(selectedPage, pixelsPerSquare).width.toFixed(1)} x
                {getRectPrintSize(selectedPage, pixelsPerSquare).height.toFixed(1)} mm
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </section>

    <section class="map-panel map-panel-grow">
      <h2>Page list</h2>
      <div class="map-page-list">
        {#each project.pages as page}
          <button
            type="button"
            class:map-page-row-active={page.id === selectedPageId}
            class="map-page-row"
            on:click={() => (selectedPageId = page.id)}
          >
            <span>{page.name}</span>
            <small>{Math.round(page.width)} x {Math.round(page.height)} px</small>
          </button>
        {:else}
          <div class="map-empty">No print pages yet.</div>
        {/each}
      </div>
    </section>
  </aside>

  <main class="map-canvas">
    <div class="map-canvas-toolbar">
      <div class="map-zoom">
        <InputGroup>
          <InputGroupText class="p-0">
            <button type="button" class="map-zoom-button" on:click={() => setZoomAroundViewportPoint(zoom - 10)}>
              <Icon name="zoom-out" />
            </button>
          </InputGroupText>
          <Input type="number" bind:value={zoom} />
          <InputGroupText>%</InputGroupText>
          <InputGroupText class="p-0">
            <button type="button" class="map-zoom-button" on:click={() => setZoomAroundViewportPoint(zoom + 10)}>
              <Icon name="zoom-in" />
            </button>
          </InputGroupText>
        </InputGroup>
      </div>
      {#if pendingCalibrationPoint}
        <div class="map-canvas-hint">Click the map to place point {pendingCalibrationPoint === 'start' ? 'A' : 'B'}.</div>
      {/if}
    </div>

    <div
      bind:this={mapScrollShellElement}
      class:map-scroll-shell-calibrating={!!pendingCalibrationPoint}
      class:map-scroll-shell-panning={!!pan}
      class="map-scroll-shell"
      on:wheel|nonpassive={handleMapWheel}
    >
      {#if project.imageSrc}
        <div
          bind:this={mapStageElement}
          class="map-stage"
          class:map-stage-calibrating={!!pendingCalibrationPoint}
          role="button"
          tabindex="0"
          style={`
            width: ${project.imageSize.width}px;
            height: ${project.imageSize.height}px;
            transform: translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100});
          `}
          on:click={handleMapClick}
          on:keydown={handleMapKeydown}
          on:pointerdown={startMapPan}
        >
          <img class="map-image" src={project.imageSrc} alt={project.name} draggable="false" />

          {#if project.calibration.start}
            <div
              class="map-calibration-marker"
              style={`left: ${(project.calibration.start.x / project.imageSize.width) * 100}%; top: ${(project.calibration.start.y / project.imageSize.height) * 100}%;`}
            >
              <span class="map-calibration-pin"><span>A</span></span>
              <span class="map-calibration-dot"></span>
            </div>
          {/if}
          {#if project.calibration.end}
            <div
              class="map-calibration-marker"
              style={`left: ${(project.calibration.end.x / project.imageSize.width) * 100}%; top: ${(project.calibration.end.y / project.imageSize.height) * 100}%;`}
            >
              <span class="map-calibration-pin"><span>B</span></span>
              <span class="map-calibration-dot"></span>
            </div>
          {/if}

          {#each project.pages as page}
            <button
              type="button"
              class:map-page-box-active={page.id === selectedPageId}
              class="map-page-box"
              style={`
                left: ${(page.x / project.imageSize.width) * 100}%;
                top: ${(page.y / project.imageSize.height) * 100}%;
                width: ${(page.width / project.imageSize.width) * 100}%;
                height: ${(page.height / project.imageSize.height) * 100}%;
              `}
              on:pointerdown={(event) => startPageDrag(event, page, 'move')}
            >
              <span>{page.name}</span>
              <i
                role="presentation"
                class="map-page-resize"
                on:pointerdown={(event) => startPageDrag(event, page, 'resize')}
              ></i>
            </button>
          {/each}
        </div>
      {:else}
        <div class="map-drop-empty">
          <Icon name="image" />
          <p>Load a battlemap image to calibrate and tile it.</p>
          <button type="button" class="map-button" on:click={() => imageFileSelector.click()}>
            <Icon name="upload" />
            <span>Choose image</span>
          </button>
        </div>
      {/if}
    </div>
  </main>
</div>

<style lang="scss">
  :global(html),
  :global(body) {
    overflow: hidden;
  }

  .map-workspace {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 56px 340px minmax(0, 1fr);
    background: var(--color-surface-editor);
  }

  .map-mode-rail {
    min-height: 100vh;
    padding: 0.75rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    border-right: 1px solid var(--color-border-strong);
    background: var(--color-surface-base);
  }

  .map-mode-button {
    width: 2.35rem;
    height: 2.35rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 0.75rem;
    color: var(--color-ink-575);
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
  }

  .map-mode-button:hover,
  .map-mode-button-active {
    border-color: var(--color-border-medium);
    background: var(--color-surface-panel-active);
    color: var(--color-ink-900);
  }

  .map-mode-button :global(svg) {
    width: 1.05rem;
    height: 1.05rem;
  }

  .map-sidebar {
    min-height: 100vh;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    overflow-y: auto;
    border-right: 1px solid var(--color-border-strong);
    background: var(--color-surface-base);
  }

  .map-menu-row,
  .map-panel-header,
  .map-action-grid,
  .map-toggle {
    display: flex;
    align-items: center;
  }

  .map-menu-row {
    gap: 0.5rem;
  }

  .map-logo {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
    object-fit: contain;
    pointer-events: none;
    opacity: 0.8;
  }

  .map-general-menu-popover {
    position: relative;
    flex: 0 0 auto;
  }

  .map-general-menu-trigger {
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.18rem;
    border: 0;
    background: transparent;
    color: var(--color-ink-900);
    transition: color 120ms ease, opacity 120ms ease;
  }

  .map-general-menu-trigger:hover {
    color: var(--color-ink-950);
    opacity: 0.82;
  }

  .map-general-menu-chevron {
    width: 0.27rem;
    height: 0.27rem;
    margin-top: -0.015rem;
    border-right: 1.125px solid currentColor;
    border-bottom: 1.125px solid currentColor;
    transform: rotate(45deg);
    transition: transform 120ms ease;
    pointer-events: none;
  }

  .map-general-menu-chevron-open {
    transform: rotate(-135deg);
  }

  .map-general-menu-panel {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 0;
    z-index: 20;
    width: min(18rem, calc(100vw - 4rem));
    padding: 0.35rem;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--bs-border-radius);
    background: var(--color-white-98);
    box-shadow: 0 18px 40px var(--color-shadow-300);
    backdrop-filter: blur(10px);
  }

  .map-general-menu-item {
    width: 100%;
    padding: 0.5rem 0.65rem;
    display: flex;
    align-items: center;
    border: 0;
    border-radius: var(--bs-border-radius);
    background: transparent;
    color: var(--color-ink-900);
    font-size: 0.82rem;
    text-align: left;
  }

  .map-general-menu-item:hover {
    background: var(--color-surface-panel);
  }

  .map-general-menu-item:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .map-general-menu-divider {
    height: 1px;
    margin: 0.35rem 0;
    background: var(--color-border-soft);
  }

  .map-panel {
    display: grid;
    gap: 0.7rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .map-panel-grow {
    min-height: 0;
    flex: 1 1 auto;
  }

  .map-panel-header {
    justify-content: space-between;
    gap: 0.75rem;
  }

  .map-panel h1,
  .map-panel h2 {
    margin: 0;
    color: var(--color-ink-900);
    font-size: var(--section-title-size);
    font-weight: var(--section-title-weight);
  }

  .map-hidden {
    display: none !important;
  }

  .map-form,
  .map-page-fields {
    display: grid;
    gap: 0.6rem;
  }

  .map-field {
    display: grid;
    gap: 0.25rem;
  }

  .map-field :global(.col-form-label),
  .map-sidebar :global(.form-control),
  .map-sidebar :global(.input-group-text),
  .map-sidebar :global(input),
  .map-sidebar :global(select) {
    font-size: var(--editor-form-font-size);
  }

  .map-action-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .map-action-grid .map-button:only-child {
    grid-column: 1 / -1;
  }

  .map-button,
  .map-zoom-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 2rem;
    border: 1px solid var(--color-border-medium);
    border-radius: 0.35rem;
    background: var(--color-surface-muted);
    color: var(--color-ink-700);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .map-button:hover,
  .map-zoom-button:hover,
  .map-button-active {
    background: var(--color-surface-panel-active);
    color: var(--color-ink-900);
  }

  .map-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .map-button-danger {
    width: 100%;
    color: var(--color-danger);
  }

  .map-toggle {
    justify-content: space-between;
    gap: 0.75rem;
    color: var(--color-ink-700);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .map-toggle :global(.form-check) {
    margin: 0;
    padding: 0;
  }

  .map-status,
  .map-warning,
  .map-empty {
    color: var(--color-ink-600);
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .map-warning {
    color: var(--color-warning);
  }

  .map-count {
    color: var(--color-ink-500);
    font-size: 0.78rem;
  }

  .map-field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .map-page-list {
    min-height: 0;
    display: grid;
    gap: 0.2rem;
    overflow-y: auto;
  }

  .map-page-row {
    padding: 0.35rem 0.45rem;
    display: grid;
    gap: 0.1rem;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--color-ink-700);
    text-align: left;
  }

  .map-page-row:hover,
  .map-page-row-active {
    background: var(--color-surface-selected);
    color: var(--color-ink-900);
  }

  .map-page-row small {
    color: var(--color-ink-500);
    font-size: 0.68rem;
  }

  .map-canvas {
    min-width: 0;
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    background:
      radial-gradient(circle at top, var(--color-white-90), var(--color-white-0) 38%),
      linear-gradient(90deg, rgba(24, 32, 47, 0.045) 1px, transparent 1px),
      linear-gradient(rgba(24, 32, 47, 0.045) 1px, transparent 1px),
      var(--color-surface-editor);
    background-size: auto, 32px 32px, 32px 32px, auto;
  }

  .map-canvas-toolbar {
    position: sticky;
    top: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  .map-zoom {
    width: 13rem;
    background: var(--color-white-96);
    border-radius: 0.5rem;
  }

  .map-zoom-button {
    width: 2rem;
    min-height: 1.85rem;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .map-canvas-hint {
    padding: 0.35rem 0.65rem;
    border: 1px solid var(--color-accent-border);
    border-radius: 999px;
    background: var(--color-white-96);
    color: var(--color-ink-700);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .map-scroll-shell {
    position: relative;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    overflow: hidden;
    padding: 1rem 2rem 3rem;
    cursor: grab;
    overscroll-behavior: contain;
  }

  .map-scroll-shell-calibrating {
    cursor: crosshair;
  }

  .map-scroll-shell-panning {
    cursor: grabbing;
  }

  .map-stage {
    position: absolute;
    top: 0;
    left: 0;
    box-shadow: 0 18px 44px var(--color-shadow-300);
    background: white;
    user-select: none;
    cursor: inherit;
    transform-origin: 0 0;
  }

  .map-stage-calibrating {
    cursor: crosshair;
  }

  .map-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: fill;
  }

  .map-calibration-marker {
    position: absolute;
    z-index: 2;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .map-calibration-pin {
    position: absolute;
    left: 0;
    top: -1.25rem;
    width: 1.25rem;
    height: 1.25rem;
    display: grid;
    place-items: center;
    border: 2px solid white;
    border-radius: 999px 999px 999px 0;
    background: #1b2a44;
    color: white;
    font-size: 0.72rem;
    font-weight: 800;
    transform: rotate(-45deg);
    transform-origin: 0 100%;
    box-shadow: 0 4px 12px var(--color-shadow-400);
  }

  .map-calibration-pin span {
    position: relative;
    z-index: 1;
    transform: rotate(45deg);
  }

  .map-calibration-dot {
    position: absolute;
    left: 0;
    top: 0;
    width: 0.34rem;
    height: 0.34rem;
    border: 1.5px solid white;
    border-radius: 999px;
    background: #1b2a44;
    box-shadow: 0 2px 7px var(--color-shadow-500);
    transform: translate(-50%, -50%);
  }

  .map-page-box {
    position: absolute;
    z-index: 1;
    padding: 0.25rem;
    border: 2px solid rgba(27, 42, 68, 0.82);
    background: rgba(81, 162, 255, 0.12);
    color: #1b2a44;
    cursor: move;
    text-align: left;
  }

  .map-page-box-active {
    border-color: #9a6b00;
    background: rgba(255, 242, 184, 0.24);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.85);
  }

  .map-page-box span {
    padding: 0.12rem 0.3rem;
    border-radius: 0.25rem;
    background: rgba(255, 255, 255, 0.88);
    color: inherit;
    font-size: 0.7rem;
    font-weight: 800;
  }

  .map-page-resize {
    position: absolute;
    right: -0.35rem;
    bottom: -0.35rem;
    width: 0.75rem;
    height: 0.75rem;
    border: 2px solid white;
    border-radius: 999px;
    background: #1b2a44;
    cursor: nwse-resize;
  }

  .map-drop-empty {
    min-height: calc(100vh - 8rem);
    display: grid;
    place-items: center;
    align-content: center;
    gap: 0.75rem;
    color: var(--color-ink-600);
    text-align: center;
  }

  .map-drop-empty :global(svg) {
    width: 2.4rem;
    height: 2.4rem;
  }

  @media (max-width: 900px) {
    :global(html),
    :global(body) {
      overflow: auto;
    }

    .map-workspace {
      grid-template-columns: 56px minmax(0, 1fr);
    }

    .map-sidebar {
      min-height: auto;
      max-height: none;
      grid-column: 2;
    }

    .map-canvas {
      grid-column: 2;
    }

    .map-mode-rail {
      grid-row: 1 / span 2;
    }
  }
</style>
