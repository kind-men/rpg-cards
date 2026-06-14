import { PAPER_SIZE_PRESETS } from '../stores/page-layout';
import type BattlemapProject from '../model/battlemap';
import type {
  BattlemapPoint,
  BattlemapPrintSettings,
  BattlemapRect,
  BattlemapSize
} from '../model/battlemap';

export const MM_PER_INCH = 25.4;

export const defaultBattlemapPrintSettings: BattlemapPrintSettings = {
  paperFormat: 'a4',
  paperSize: { ...PAPER_SIZE_PRESETS.a4 },
  margins: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  },
  adjust: {
    x: undefined,
    y: undefined
  },
  gridOverlay: 'none',
  showCropMarks: true,
  snapToGrid: true
};

export const createEmptyBattlemapProject = (): BattlemapProject => ({
  name: 'Untitled battlemap',
  imageSrc: '',
  imageSize: {
    width: 0,
    height: 0
  },
  calibration: {
    squareCount: 1
  },
  print: structuredClone(defaultBattlemapPrintSettings),
  pages: []
});

export const getDistance = (a?: BattlemapPoint, b?: BattlemapPoint): number => {
  if (!a || !b) {
    return 0;
  }

  return Math.hypot(b.x - a.x, b.y - a.y);
};

export const getPixelsPerSquare = (project: Pick<BattlemapProject, 'calibration'>): number => {
  const distance = getDistance(project.calibration.start, project.calibration.end);
  const squareCount = 1;

  if (distance <= 0 || squareCount <= 0) {
    return 0;
  }

  return distance / squareCount;
};

export const pixelsToMillimeters = (pixels: number, pixelsPerSquare: number): number => {
  if (pixelsPerSquare <= 0) {
    return 0;
  }

  return (pixels / pixelsPerSquare) * MM_PER_INCH;
};

export const millimetersToPixels = (millimeters: number, pixelsPerSquare: number): number =>
  (millimeters / MM_PER_INCH) * pixelsPerSquare;

export const getMapPrintSize = (imageSize: BattlemapSize, pixelsPerSquare: number): BattlemapSize => ({
  width: pixelsToMillimeters(imageSize.width, pixelsPerSquare),
  height: pixelsToMillimeters(imageSize.height, pixelsPerSquare)
});

export const getPrintablePaperSize = (print: BattlemapPrintSettings): BattlemapSize => ({
  width: Math.max(0, print.paperSize.width - print.margins.left - print.margins.right),
  height: Math.max(0, print.paperSize.height - print.margins.top - print.margins.bottom)
});

export const getPrintablePaperSizePixels = (
  print: BattlemapPrintSettings,
  pixelsPerSquare: number
): BattlemapSize => {
  const printable = getPrintablePaperSize(print);

  return {
    width: millimetersToPixels(printable.width, pixelsPerSquare),
    height: millimetersToPixels(printable.height, pixelsPerSquare)
  };
};

export const getRectPrintSize = (rect: BattlemapRect, pixelsPerSquare: number): BattlemapSize => ({
  width: pixelsToMillimeters(rect.width, pixelsPerSquare),
  height: pixelsToMillimeters(rect.height, pixelsPerSquare)
});

export const getRectCropOffset = (rect: BattlemapRect, pixelsPerSquare: number): BattlemapPoint => ({
  x: -pixelsToMillimeters(rect.x, pixelsPerSquare),
  y: -pixelsToMillimeters(rect.y, pixelsPerSquare)
});

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const snapToGrid = (value: number, pixelsPerSquare: number): number => {
  if (pixelsPerSquare <= 0) {
    return value;
  }

  return Math.round(value / pixelsPerSquare) * pixelsPerSquare;
};

export const clampRectToImage = (
  rect: BattlemapRect,
  imageSize: BattlemapSize,
  minimumSize = 20
): BattlemapRect => {
  const width = clamp(rect.width, minimumSize, Math.max(minimumSize, imageSize.width));
  const height = clamp(rect.height, minimumSize, Math.max(minimumSize, imageSize.height));

  return {
    ...rect,
    width,
    height,
    x: clamp(rect.x, 0, Math.max(0, imageSize.width - width)),
    y: clamp(rect.y, 0, Math.max(0, imageSize.height - height))
  };
};

export const createAutoBattlemapPages = (project: BattlemapProject): BattlemapRect[] => {
  const pixelsPerSquare = getPixelsPerSquare(project);
  const pageSize = getPrintablePaperSizePixels(project.print, pixelsPerSquare);

  if (!project.imageSize.width || !project.imageSize.height || pageSize.width <= 0 || pageSize.height <= 0) {
    return [];
  }

  const pages: BattlemapRect[] = [];
  let pageIndex = 1;

  for (let y = 0; y < project.imageSize.height; y += pageSize.height) {
    for (let x = 0; x < project.imageSize.width; x += pageSize.width) {
      pages.push({
        id: crypto.randomUUID(),
        name: `Page ${pageIndex}`,
        x,
        y,
        width: Math.min(pageSize.width, project.imageSize.width - x),
        height: Math.min(pageSize.height, project.imageSize.height - y)
      });
      pageIndex += 1;
    }
  }

  return pages;
};

export const normalizeBattlemapProject = (
  project: Partial<BattlemapProject> | null | undefined
): BattlemapProject => {
  const fallback = createEmptyBattlemapProject();
  const paperFormat = project?.print?.paperFormat ?? fallback.print.paperFormat;
  const paperSize =
    paperFormat === 'custom'
      ? {
          width: project?.print?.paperSize?.width ?? fallback.print.paperSize.width,
          height: project?.print?.paperSize?.height ?? fallback.print.paperSize.height
        }
      : { ...PAPER_SIZE_PRESETS[paperFormat] };

  return {
    ...fallback,
    ...project,
    imageSize: {
      ...fallback.imageSize,
      ...project?.imageSize
    },
    calibration: {
      ...fallback.calibration,
      ...project?.calibration,
      squareCount: 1
    },
    print: {
      ...fallback.print,
      ...project?.print,
      paperFormat,
      paperSize,
      margins: {
        ...fallback.print.margins,
        ...project?.print?.margins
      },
      adjust: {
        ...fallback.print.adjust,
        ...project?.print?.adjust
      }
    },
    pages: project?.pages ?? []
  };
};
