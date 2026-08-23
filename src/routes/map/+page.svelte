<script lang="ts">
  import 'ress/dist/ress.min.css';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { Icon, Input, InputGroup, InputGroupText, Label } from '@sveltestrap/sveltestrap';
  import { get } from 'svelte/store';
  import {
    clampRectToImage,
    createAutoBattlemapPages,
    DEFAULT_PIXELS_PER_INCH,
    getCalibrationSquarePixels,
    getOrientedPaperSize,
    getPixelsPerSquare,
    getPrintablePaperSizePixels,
    getRectPrintSize,
    millimetersToPixels,
    normalizeBattlemapProject,
    pixelsToMillimeters,
    resizePagesForPixelsPerSquare,
    snapToGrid
  } from '$lib/battlemap';
  import type { BattlemapGridOverlay, BattlemapPageOrientation, BattlemapPoint, BattlemapRect } from '$model/battlemap';
  import type { PaperFormat } from '$model/page-layout';
  import { PAPER_SIZE_PRESETS } from '../../stores/page-layout';
  import { battlemapProject } from '../../stores/battlemap';

  let imageFileSelector: HTMLInputElement;
  let projectFileSelector: HTMLInputElement;
  let hiddenDownloadLink: HTMLAnchorElement;
  let mapStageElement: HTMLDivElement;
  let mapScrollShellElement: HTMLDivElement;
  let downloadUrl = '';
  let pendingCalibrationSquare = false;
  let calibrationDrag:
    | {
        start: BattlemapPoint;
        current: BattlemapPoint;
      }
    | undefined;
  let calibrationDraft: { x: number; y: number; width: number; height: number } | undefined;
  let selectedPageId = '';
  let zoom = 35;
  let panOffset: BattlemapPoint = { x: 24, y: 24 };
  let projectWarning = '';
  let generalMenuOpen = false;
  let showPageMargins = false;
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
  const paperFormatOptions: { value: PaperFormat; label: string }[] = [
    { value: 'a4', label: 'A4' },
    { value: 'letter', label: 'Letter' },
    { value: 'legal', label: 'Legal' },
    { value: 'a3', label: 'A3' },
    { value: 'a5', label: 'A5' },
    { value: 'custom', label: 'Custom' }
  ];
  const gridOverlayOptions: { value: BattlemapGridOverlay; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ];

  $: project = $battlemapProject;
  $: pixelsPerSquare = getPixelsPerSquare(project);
  $: isCalibrated = pixelsPerSquare > 0;
  $: selectedPage = project.pages.find((page) => page.id === selectedPageId);
  $: printablePageSize = getPrintablePaperSizePixels(project.print, pixelsPerSquare);
  $: orientedPaperSize = getOrientedPaperSize(project.print);
  $: selectedPagePrintSize = selectedPage ? getRectPrintSize(selectedPage, pixelsPerSquare) : undefined;
  $: selectedPagePrintTotal = selectedPagePrintSize
    ? {
        width: selectedPagePrintSize.width + project.print.margins.left + project.print.margins.right,
        height: selectedPagePrintSize.height + project.print.margins.top + project.print.margins.bottom
      }
    : undefined;
  $: selectedPageWidthInvalid = !!selectedPagePrintTotal && selectedPagePrintTotal.width > orientedPaperSize.width;
  $: selectedPageHeightInvalid = !!selectedPagePrintTotal && selectedPagePrintTotal.height > orientedPaperSize.height;
  $: selectedPageInvalid = selectedPageWidthInvalid || selectedPageHeightInvalid;

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
        pixelsPerSquare: DEFAULT_PIXELS_PER_INCH,
        squareCount: 1
      },
      pages: []
    }));

    selectedPageId = '';
    pendingCalibrationSquare = false;
    calibrationDrag = undefined;
    calibrationDraft = undefined;
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

  const getRectFromPoints = (start: BattlemapPoint, end: BattlemapPoint) => ({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  });

  const startCalibrationSquareDrag = (event: PointerEvent) => {
    if (!pendingCalibrationSquare || event.button !== 0) {
      return;
    }

    const point = getStageImagePoint(event);
    if (!point) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    calibrationDrag = {
      start: point,
      current: point
    };
    calibrationDraft = getRectFromPoints(point, point);
    didPan = false;
  };

  const commitCalibrationSquare = () => {
    if (!calibrationDraft || calibrationDraft.width < 4 || calibrationDraft.height < 4) {
      calibrationDrag = undefined;
      calibrationDraft = undefined;
      pendingCalibrationSquare = false;
      return;
    }

    const square = { ...calibrationDraft };
    const nextPixelsPerSquare = getCalibrationSquarePixels(square);

    battlemapProject.update((current) => {
      const previousPixelsPerSquare = getPixelsPerSquare(current);

      return {
        ...current,
        calibration: {
          ...current.calibration,
          start: undefined,
          end: undefined,
          square,
          gridOrigin: {
            x: square.x,
            y: square.y
          },
          pixelsPerSquare: nextPixelsPerSquare,
          squareCount: 1
        },
        pages: resizePagesForPixelsPerSquare(
          current.pages,
          current.imageSize,
          previousPixelsPerSquare,
          nextPixelsPerSquare
        )
      };
    });

    calibrationDrag = undefined;
    calibrationDraft = undefined;
    pendingCalibrationSquare = false;
  };

  const handleMapKeydown = (event: KeyboardEvent) => {
    if (!pendingCalibrationSquare || event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    pendingCalibrationSquare = false;
    calibrationDrag = undefined;
    calibrationDraft = undefined;
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

    removePage(selectedPageId);
  };

  const removePage = (pageId: string) => {
    battlemapProject.update((current) => ({
      ...current,
      pages: current.pages.filter((page) => page.id !== pageId)
    }));

    if (selectedPageId === pageId) {
      selectedPageId = '';
    }
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

  const updateSelectedPageMillimeters = (
    field: 'x' | 'y' | 'width' | 'height',
    event: Event
  ) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    updateSelectedPage({
      [field]: millimetersToPixels(Math.max(0, value || 0), pixelsPerSquare)
    });
  };

  const getPagePrintSize = (page: BattlemapRect) => getRectPrintSize(page, pixelsPerSquare);

  const isPagePrintSizeInvalid = (page: BattlemapRect) => {
    const printSize = getPagePrintSize(page);

    return (
      printSize.width + project.print.margins.left + project.print.margins.right > orientedPaperSize.width ||
      printSize.height + project.print.margins.top + project.print.margins.bottom > orientedPaperSize.height
    );
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
    if (calibrationDrag) {
      const point = getStageImagePoint(event);
      if (point) {
        calibrationDrag = {
          ...calibrationDrag,
          current: point
        };
        calibrationDraft = getRectFromPoints(calibrationDrag.start, point);
      }
      return;
    }

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
    if (calibrationDrag) {
      commitCalibrationSquare();
    }

    drag = undefined;
    pan = undefined;
  };

  const startMapPan = (event: PointerEvent) => {
    if (pendingCalibrationSquare || event.button !== 0) {
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

  const setPixelsPerSquare = (event: Event) => {
    const pixelsPerSquare = Number((event.currentTarget as HTMLInputElement).value);
    battlemapProject.update((current) => {
      const previousPixelsPerSquare = getPixelsPerSquare(current);
      const nextPixelsPerSquare = Math.max(1, pixelsPerSquare || DEFAULT_PIXELS_PER_INCH);

      return {
        ...current,
        calibration: {
          ...current.calibration,
          pixelsPerSquare: nextPixelsPerSquare,
          squareCount: 1
        },
        pages: resizePagesForPixelsPerSquare(
          current.pages,
          current.imageSize,
          previousPixelsPerSquare,
          nextPixelsPerSquare
        )
      };
    });
  };

  const setPageOrientation = (event: Event) => {
    const orientation = (event.currentTarget as HTMLSelectElement).value as BattlemapPageOrientation;
    battlemapProject.update((current) => ({
      ...current,
      print: {
        ...current.print,
        orientation
      }
    }));
  };

  const setPaperFormat = (event: Event) => {
    const paperFormat = (event.currentTarget as HTMLSelectElement).value as PaperFormat;
    battlemapProject.update((current) => ({
      ...current,
      print: {
        ...current.print,
        paperFormat,
        paperSize:
          paperFormat === 'custom' ? { ...current.print.paperSize } : { ...PAPER_SIZE_PRESETS[paperFormat] }
      }
    }));
  };

  const setMargin = (side: 'top' | 'right' | 'bottom' | 'left', event: Event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    battlemapProject.update((current) => ({
      ...current,
      print: {
        ...current.print,
        margins: {
          ...current.print.margins,
          [side]: Math.max(0, value || 0)
        }
      }
    }));
  };

  const setGridOverlay = (event: Event) => {
    const gridOverlay = (event.currentTarget as HTMLSelectElement).value as BattlemapGridOverlay;
    battlemapProject.update((current) => ({
      ...current,
      print: {
        ...current.print,
        gridOverlay
      }
    }));
  };

  const setGridOffset = (axis: 'x' | 'y', event: Event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    battlemapProject.update((current) => ({
      ...current,
      print: {
        ...current.print,
        gridOffset: {
          ...current.print.gridOffset,
          [axis]: value || 0
        }
      }
    }));
  };

  const handlePrint = async () => {
    generalMenuOpen = false;
    await goto(`${base}/map/print`);
  };

  const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.code === 'KeyP') {
      event.preventDefault();
      void handlePrint();
    }
  };

  const resetProject = () => {
    generalMenuOpen = false;
    battlemapProject.reset();
    selectedPageId = '';
    pendingCalibrationSquare = false;
    calibrationDrag = undefined;
    calibrationDraft = undefined;
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

  const toggleCalibrationSquare = () => {
    pendingCalibrationSquare = !pendingCalibrationSquare;
    calibrationDrag = undefined;
    calibrationDraft = undefined;
  };
</script>

<svelte:window
  on:click={closeGeneralMenu}
  on:keydown={handleWindowKeydown}
  on:pointermove={handleWindowPointerMove}
  on:pointerup={stopDrag}
/>

<div class="map-workspace" class:map-workspace-has-inspector={!!selectedPage}>
  <nav class="map-mode-rail" aria-label="Workspace modes">
    <a class="map-mode-button" href={`${base}/`} aria-label="Cards">
      <Icon name="phone" />
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
      <h2>Grid</h2>
      <div class="map-form">
        <div class="map-action-grid">
          <button
            type="button"
            class:map-button-active={pendingCalibrationSquare}
            class="map-button"
            disabled={!project.imageSrc}
            on:click={toggleCalibrationSquare}
          >
            <Icon name="bounding-box" />
            <span>Draw square</span>
          </button>
        </div>
        <div class="map-field">
          <Label for="map-pixels-per-inch">Pixels per 1 inch square</Label>
          <InputGroup id="map-pixels-per-inch">
            <Input
              type="number"
              min="1"
              step="0.1"
              value={pixelsPerSquare.toFixed(2)}
              on:input={setPixelsPerSquare}
            />
            <InputGroupText>px</InputGroupText>
          </InputGroup>
        </div>
        <div class="map-field">
          <Label for="map-grid-overlay">Grid overlay</Label>
          <Input id="map-grid-overlay" type="select" value={project.print.gridOverlay} on:change={setGridOverlay}>
            {#each gridOverlayOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </Input>
        </div>
        {#if project.print.gridOverlay !== 'none'}
          <div class="map-field">
            <Label for="map-grid-offset">Grid offset</Label>
            <div id="map-grid-offset" class="map-field-grid">
              <InputGroup>
                <InputGroupText>X</InputGroupText>
                <Input type="number" value={project.print.gridOffset.x} on:input={(event) => setGridOffset('x', event)} />
                <InputGroupText>px</InputGroupText>
              </InputGroup>
              <InputGroup>
                <InputGroupText>Y</InputGroupText>
                <Input type="number" value={project.print.gridOffset.y} on:input={(event) => setGridOffset('y', event)} />
                <InputGroupText>px</InputGroupText>
              </InputGroup>
            </div>
          </div>
        {/if}
      </div>
    </section>

    <section class="map-panel">
      <div class="map-panel-header">
        <h2>Pages</h2>
      </div>
      <div class="map-form">
        <div class="map-field">
          <div class="map-field-label-row">
            <Label for="map-page-paper-size">Paper size</Label>
            <button
              type="button"
              class:map-icon-toggle-active={showPageMargins}
              class="map-icon-toggle"
              aria-label={showPageMargins ? 'Hide margins' : 'Show margins'}
              aria-expanded={showPageMargins}
              aria-controls="map-page-margins"
              on:click={() => (showPageMargins = !showPageMargins)}
            >
              <Icon name="fullscreen" />
            </button>
          </div>
          <Input
            id="map-page-paper-size"
            type="select"
            value={project.print.paperFormat}
            on:change={setPaperFormat}
          >
            {#each paperFormatOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </Input>
        </div>
        {#if showPageMargins}
          <div class="map-field">
            <Label for="map-page-margins">Margins</Label>
            <div id="map-page-margins" class="map-field-grid">
              <InputGroup>
                <InputGroupText>T</InputGroupText>
                <Input type="number" value={project.print.margins.top} on:input={(event) => setMargin('top', event)} />
                <InputGroupText>mm</InputGroupText>
              </InputGroup>
              <InputGroup>
                <InputGroupText>R</InputGroupText>
                <Input type="number" value={project.print.margins.right} on:input={(event) => setMargin('right', event)} />
                <InputGroupText>mm</InputGroupText>
              </InputGroup>
              <InputGroup>
                <InputGroupText>B</InputGroupText>
                <Input type="number" value={project.print.margins.bottom} on:input={(event) => setMargin('bottom', event)} />
                <InputGroupText>mm</InputGroupText>
              </InputGroup>
              <InputGroup>
                <InputGroupText>L</InputGroupText>
                <Input type="number" value={project.print.margins.left} on:input={(event) => setMargin('left', event)} />
                <InputGroupText>mm</InputGroupText>
              </InputGroup>
            </div>
          </div>
        {/if}
        <div class="map-auto-pages-row">
          <Input
            aria-label="Page orientation"
            class="map-orientation-select"
            type="select"
            value={project.print.orientation}
            on:change={setPageOrientation}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </Input>
          <button
            type="button"
            class="map-button map-button-wide"
            disabled={!project.imageSrc}
            on:click={generatePages}
          >
            <Icon name="grid-3x3" />
            <span>Auto pages</span>
          </button>
        </div>
        <label class="map-toggle">
          <span>Snap to grid</span>
          <Input type="checkbox" checked={project.print.snapToGrid} on:change={setSnapToGrid} />
        </label>
      </div>
    </section>

    <section class="map-panel map-panel-grow map-pages-wrapper">
      <div class="map-pages-list-header">
        <div class="map-pages-list-title">
          <span>Pages</span>
          {#if project.pages.length > 0}
            <span class="map-pages-count">{project.pages.length}</span>
          {/if}
        </div>
        <div class="map-pages-list-actions">
          <button
            class="map-pages-header-action"
            type="button"
            aria-label="Add page"
            disabled={!project.imageSrc}
            on:click={addPage}
          >
            <Icon name="plus-lg" />
          </button>
        </div>
      </div>

      <div class="map-page-list" role="list">
        {#each project.pages as page}
          <div
            class:map-page-row-active={page.id === selectedPageId}
            class="map-page-row"
            role="button"
            tabindex="0"
            on:click={() => (selectedPageId = page.id)}
            on:keydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectedPageId = page.id;
              }
            }}
          >
            <span class="map-page-row-main">
              <span class="map-page-row-icon">
                <Icon name="file-earmark" />
              </span>
              <span class="map-page-row-text">
                <span class="map-page-row-title">{page.name}</span>
                <small>
                  {Math.round(pixelsToMillimeters(page.width, pixelsPerSquare))} mm x
                  {Math.round(pixelsToMillimeters(page.height, pixelsPerSquare))} mm
                </small>
              </span>
            </span>
            <span class="map-page-row-actions">
              <button
                type="button"
                class="map-page-row-action"
                aria-label={`Delete ${page.name}`}
                on:click={(event) => {
                  event.stopPropagation();
                  removePage(page.id);
                }}
              >
                <Icon name="trash" />
              </button>
            </span>
          </div>
        {:else}
          <div class="map-empty map-pages-empty">No print pages yet.</div>
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
      {#if pendingCalibrationSquare}
        <div class="map-canvas-hint">Drag around one grid square on the map.</div>
      {/if}
    </div>

    <div
      bind:this={mapScrollShellElement}
      class:map-scroll-shell-calibrating={pendingCalibrationSquare}
      class:map-scroll-shell-panning={!!pan}
      class="map-scroll-shell"
      role="region"
      aria-label="Battlemap canvas"
      on:wheel|nonpassive={handleMapWheel}
      on:pointerdown={startMapPan}
    >
      {#if project.imageSrc}
        <div
          bind:this={mapStageElement}
          class="map-stage"
          class:map-stage-calibrating={pendingCalibrationSquare}
          role="button"
          tabindex="0"
          style={`
            width: ${project.imageSize.width}px;
            height: ${project.imageSize.height}px;
            transform: translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100});
          `}
          on:keydown={handleMapKeydown}
          on:pointerdown={startCalibrationSquareDrag}
        >
          <img class="map-image" src={project.imageSrc} alt={project.name} draggable="false" />
          {#if project.print.gridOverlay !== 'none'}
            <div
              class:map-grid-overlay-light={project.print.gridOverlay === 'light'}
              class:map-grid-overlay-dark={project.print.gridOverlay === 'dark'}
              class="map-grid-overlay"
              style={`
                --map-grid-size: ${pixelsPerSquare}px;
                --map-grid-offset-x: ${project.print.gridOffset.x}px;
                --map-grid-offset-y: ${project.print.gridOffset.y}px;
              `}
            ></div>
          {/if}

          {#if project.calibration.square}
            <div
              class="map-calibration-square"
              style={`
                left: ${(project.calibration.square.x / project.imageSize.width) * 100}%;
                top: ${(project.calibration.square.y / project.imageSize.height) * 100}%;
                width: ${(project.calibration.square.width / project.imageSize.width) * 100}%;
                height: ${(project.calibration.square.height / project.imageSize.height) * 100}%;
              `}
            ></div>
          {/if}
          {#if calibrationDraft && calibrationDraft.width > 0 && calibrationDraft.height > 0}
            <div
              class="map-calibration-square map-calibration-square-draft"
              style={`
                left: ${(calibrationDraft.x / project.imageSize.width) * 100}%;
                top: ${(calibrationDraft.y / project.imageSize.height) * 100}%;
                width: ${(calibrationDraft.width / project.imageSize.width) * 100}%;
                height: ${(calibrationDraft.height / project.imageSize.height) * 100}%;
              `}
            ></div>
          {/if}

          {#each project.pages as page}
            <button
              type="button"
              class:map-page-box-active={page.id === selectedPageId}
              class:map-page-box-invalid={isPagePrintSizeInvalid(page)}
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

  {#if selectedPage}
    <aside class="map-inspector">
      <div class="map-inspector-header">
        <div>
          <h2>Page</h2>
          <p>{selectedPage.name || 'Untitled page'}</p>
        </div>
        <button
          class="map-inspector-icon-button map-inspector-icon-button-danger"
          type="button"
          aria-label="Delete selected page"
          on:click={removeSelectedPage}
        >
          <Icon name="trash" />
        </button>
      </div>

      <section class="map-inspector-section">
        <div class="map-inspector-section-header">
          <h3>Details</h3>
        </div>
        <div class="map-page-fields">
          <div class="map-field">
            <Label for="selected-page-name">Name</Label>
            <Input
              id="selected-page-name"
              value={selectedPage.name}
              on:input={(event) => updateSelectedPage({ name: event.currentTarget.value })}
            />
          </div>
        </div>
      </section>

      <section class="map-inspector-section">
        <div class="map-inspector-section-header">
          <h3>Bounds</h3>
        </div>
        <div class="map-field-grid">
          <InputGroup>
            <InputGroupText>X</InputGroupText>
            <Input
              type="number"
              step="0.1"
              value={pixelsToMillimeters(selectedPage.x, pixelsPerSquare).toFixed(1)}
              on:input={(event) => updateSelectedPageMillimeters('x', event)}
            />
            <InputGroupText>mm</InputGroupText>
          </InputGroup>
          <InputGroup>
            <InputGroupText>Y</InputGroupText>
            <Input
              type="number"
              step="0.1"
              value={pixelsToMillimeters(selectedPage.y, pixelsPerSquare).toFixed(1)}
              on:input={(event) => updateSelectedPageMillimeters('y', event)}
            />
            <InputGroupText>mm</InputGroupText>
          </InputGroup>
          <InputGroup>
            <InputGroupText>W</InputGroupText>
            <Input
              type="number"
              step="0.1"
              value={pixelsToMillimeters(selectedPage.width, pixelsPerSquare).toFixed(1)}
              on:input={(event) => updateSelectedPageMillimeters('width', event)}
            />
            <InputGroupText>mm</InputGroupText>
          </InputGroup>
          <InputGroup>
            <InputGroupText>H</InputGroupText>
            <Input
              type="number"
              step="0.1"
              value={pixelsToMillimeters(selectedPage.height, pixelsPerSquare).toFixed(1)}
              on:input={(event) => updateSelectedPageMillimeters('height', event)}
            />
            <InputGroupText>mm</InputGroupText>
          </InputGroup>
        </div>
      </section>

      {#if selectedPagePrintSize && selectedPagePrintTotal}
        <section class="map-inspector-section">
          <div class="map-inspector-section-header">
            <h3>Print size</h3>
          </div>
          <div class="map-print-size-summary">
            <strong class:map-print-size-invalid={selectedPageWidthInvalid}>{selectedPagePrintSize.width.toFixed(1)} mm</strong>
            <span>by</span>
            <strong class:map-print-size-invalid={selectedPageHeightInvalid}>{selectedPagePrintSize.height.toFixed(1)} mm</strong>
          </div>
          <div class="map-print-margin-summary">
            <span>Margins</span>
            <strong>
              L {project.print.margins.left.toFixed(1)} / R {project.print.margins.right.toFixed(1)} mm
            </strong>
            <strong>
              T {project.print.margins.top.toFixed(1)} / B {project.print.margins.bottom.toFixed(1)} mm
            </strong>
          </div>
          <div class="map-print-total-summary">
            <span>Total on paper</span>
            <strong class:map-print-size-invalid={selectedPageWidthInvalid}>
              {selectedPagePrintTotal.width.toFixed(1)} / {orientedPaperSize.width.toFixed(1)} mm wide
            </strong>
            <strong class:map-print-size-invalid={selectedPageHeightInvalid}>
              {selectedPagePrintTotal.height.toFixed(1)} / {orientedPaperSize.height.toFixed(1)} mm high
            </strong>
          </div>
          {#if selectedPageInvalid}
            <div class="map-inspector-error" role="alert">
              <Icon name="exclamation-triangle" />
              <span>
                Page size plus margins exceeds the selected {project.print.paperFormat.toUpperCase()} paper
                {selectedPageWidthInvalid && selectedPageHeightInvalid
                  ? ' width and height.'
                  : selectedPageWidthInvalid
                    ? ' width.'
                    : ' height.'}
              </span>
            </div>
          {/if}
        </section>
      {/if}
    </aside>
  {/if}
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

  .map-workspace-has-inspector {
    grid-template-columns: 56px 340px minmax(0, 1fr) 340px;
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

  .map-inspector {
    min-height: 100vh;
    max-height: 100vh;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    border-left: 1px solid var(--color-border-strong);
    background: var(--color-surface-base);
  }

  .map-inspector-header {
    min-height: 4.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .map-inspector-header h2,
  .map-inspector-section-header h3 {
    margin: 0;
    color: var(--color-ink-900);
    font-size: var(--section-title-size);
    font-weight: var(--section-title-weight);
  }

  .map-inspector-header p {
    max-width: 15rem;
    margin: 0.25rem 0 0;
    overflow: hidden;
    color: var(--color-ink-575);
    font-size: 0.78rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .map-inspector-icon-button {
    width: 1.7rem;
    height: 1.7rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--color-ink-550);
    transition: background-color 120ms ease, color 120ms ease;
  }

  .map-inspector-icon-button:hover {
    background: var(--color-overlay-muted);
    color: var(--color-ink-900);
  }

  .map-inspector-icon-button-danger:hover {
    color: var(--color-danger-strong);
  }

  .map-inspector-section {
    display: grid;
    gap: 0.7rem;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .map-inspector-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .map-print-size-summary {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    color: var(--color-ink-575);
    font-size: 0.78rem;
  }

  .map-print-size-summary strong,
  .map-print-margin-summary strong,
  .map-print-total-summary strong {
    color: var(--color-ink-900);
    font-weight: 700;
  }

  .map-print-margin-summary,
  .map-print-total-summary {
    display: grid;
    gap: 0.2rem;
    color: var(--color-ink-575);
    font-size: 0.76rem;
  }

  .map-print-size-invalid,
  .map-print-size-summary .map-print-size-invalid,
  .map-print-total-summary .map-print-size-invalid {
    color: var(--color-danger-strong);
  }

  .map-inspector-error {
    display: flex;
    align-items: flex-start;
    gap: 0.45rem;
    padding: 0.65rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--color-danger-strong) 45%, transparent);
    border-radius: 0.35rem;
    background: color-mix(in srgb, var(--color-danger-strong) 10%, var(--color-surface-base));
    color: var(--color-danger-strong);
    font-size: 0.76rem;
    font-weight: 700;
    line-height: 1.35;
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

  .map-field-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .map-field :global(.col-form-label),
  .map-sidebar :global(.form-control),
  .map-sidebar :global(.input-group-text),
  .map-sidebar :global(input),
  .map-sidebar :global(select),
  .map-inspector :global(.form-control),
  .map-inspector :global(.input-group-text),
  .map-inspector :global(input),
  .map-inspector :global(select) {
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

  .map-auto-pages-row {
    display: grid;
    grid-template-columns: minmax(7.5rem, 0.8fr) minmax(0, 1.2fr);
    gap: 0.4rem;
    align-items: stretch;
  }

  .map-auto-pages-row :global(.map-orientation-select.form-select) {
    min-height: 2rem;
    padding-top: var(--editor-form-control-padding-y);
    padding-bottom: var(--editor-form-control-padding-y);
    border-radius: 0.35rem;
    font-size: var(--editor-form-font-size);
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
    padding: 0.5rem 1rem;
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

  .map-button-wide {
    width: 100%;
  }

  .map-icon-toggle {
    width: 1.7rem;
    height: 1.7rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--color-ink-550);
    transition: background-color 120ms ease, color 120ms ease;
  }

  .map-icon-toggle:hover,
  .map-icon-toggle-active {
    background: var(--color-overlay-muted);
    color: var(--color-ink-900);
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

  .map-warning,
  .map-empty {
    color: var(--color-ink-600);
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .map-warning {
    color: var(--color-warning);
  }

  .map-field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .map-page-list {
    min-height: 0;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 0.1rem;
    overflow-y: auto;
    padding-right: 0.2rem;
  }

  .map-pages-wrapper {
    --map-pages-text-primary: var(--color-ink-900);
    --map-pages-text-subtle: var(--color-ink-550);
    --map-pages-text-faint: var(--color-ink-500);
    --map-pages-hover-overlay: var(--color-overlay-muted);
    --map-pages-row-hover: var(--color-overlay-faint);
    --map-pages-selected-surface: var(--color-surface-selected);
    --map-pages-active-border: var(--color-border-active);
    min-height: 0;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 0.15rem;
  }

  .map-pages-list-header {
    min-height: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0 0.15rem;
    color: var(--map-pages-text-faint);
    font-size: 0.8rem;
  }

  .map-pages-list-title {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .map-pages-count {
    color: var(--map-pages-text-primary);
  }

  .map-pages-list-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
  }

  .map-pages-header-action,
  .map-page-row-action {
    width: 1.7rem;
    height: 1.7rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--map-pages-text-subtle);
    transition: background-color 120ms ease, color 120ms ease, opacity 120ms ease;
  }

  .map-pages-header-action:hover,
  .map-page-row-action:hover {
    background: var(--map-pages-hover-overlay);
    color: var(--map-pages-text-primary);
  }

  .map-pages-header-action:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .map-page-row {
    width: 100%;
    min-height: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.2rem 0.25rem;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--map-pages-text-primary);
    text-align: left;
  }

  .map-page-row:hover {
    background: var(--map-pages-row-hover);
  }

  .map-page-row-active {
    background: var(--map-pages-selected-surface);
  }

  .map-page-row-main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex: 1 1 auto;
  }

  .map-page-row-icon {
    width: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--map-pages-text-faint);
  }

  .map-page-row-text {
    min-width: 0;
    display: grid;
    gap: 0.05rem;
  }

  .map-page-row-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.78rem;
  }

  .map-page-row-text small {
    color: var(--map-pages-text-faint);
    font-size: 0.68rem;
  }

  .map-page-row-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
    opacity: 0;
    pointer-events: none;
  }

  .map-page-row:hover .map-page-row-actions,
  .map-page-row:focus-visible .map-page-row-actions,
  .map-page-row-active .map-page-row-actions {
    opacity: 1;
    pointer-events: auto;
  }

  .map-page-row-active {
    box-shadow: inset 3px 0 0 var(--map-pages-active-border);
  }

  .map-pages-empty {
    padding: 0.75rem 0.25rem;
    color: var(--map-pages-text-faint);
    font-size: 0.78rem;
    text-align: center;
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

  .map-grid-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background-image:
      repeating-linear-gradient(
        to right,
        var(--map-grid-color) 0,
        var(--map-grid-color) 2px,
        transparent 2px,
        transparent var(--map-grid-size)
      ),
      repeating-linear-gradient(
        to bottom,
        var(--map-grid-color) 0,
        var(--map-grid-color) 2px,
        transparent 2px,
        transparent var(--map-grid-size)
      );
    background-position: var(--map-grid-offset-x) var(--map-grid-offset-y);
    background-repeat: repeat;
    mix-blend-mode: var(--map-grid-blend-mode);
  }

  .map-grid-overlay-light {
    --map-grid-color: rgba(255, 255, 255, 0.86);
    --map-grid-blend-mode: screen;
  }

  .map-grid-overlay-dark {
    --map-grid-color: rgba(0, 0, 0, 0.58);
    --map-grid-blend-mode: multiply;
  }

  .map-calibration-square {
    position: absolute;
    z-index: 4;
    pointer-events: none;
    border: 2px solid #1b2a44;
    background: rgba(255, 255, 255, 0.14);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.92),
      0 0 0 1px rgba(27, 42, 68, 0.28),
      0 8px 22px var(--color-shadow-300);
  }

  .map-calibration-square-draft {
    border-style: dashed;
    background: rgba(81, 162, 255, 0.18);
  }

  .map-page-box {
    position: absolute;
    z-index: 3;
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

  .map-page-box-invalid {
    border-color: var(--color-danger-strong);
    background: rgba(205, 50, 50, 0.12);
  }

  .map-page-box-invalid.map-page-box-active {
    border-color: var(--color-danger-strong);
    background: rgba(205, 50, 50, 0.24);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.78);
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

    .map-workspace-has-inspector {
      grid-template-columns: 56px minmax(0, 1fr);
    }

    .map-sidebar,
    .map-inspector {
      min-height: auto;
      max-height: none;
      grid-column: 2;
    }

    .map-inspector {
      border-top: 1px solid var(--color-border-strong);
      border-left: 0;
    }

    .map-canvas {
      grid-column: 2;
    }

    .map-mode-rail {
      grid-row: 1 / span 2;
    }
  }
</style>
