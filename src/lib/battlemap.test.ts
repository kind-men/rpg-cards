import { describe, expect, it } from 'vitest';
import {
  createAutoBattlemapPages,
  createEmptyBattlemapProject,
  getCalibrationSquarePixels,
  getPixelsPerSquare,
  getPrintablePaperSize,
  getRectCropOffset,
  getRectPrintSize,
  pixelsToMillimeters,
  resizePagesForPixelsPerSquare
} from './battlemap';

describe('battlemap print math', () => {
  it('uses 70 pixels per inch before calibration', () => {
    const project = createEmptyBattlemapProject();

    expect(getPixelsPerSquare(project)).toBe(70);
  });

  it('uses a manual pixels per inch override when provided', () => {
    const project = createEmptyBattlemapProject();
    project.calibration = {
      start: { x: 10, y: 20 },
      end: { x: 70, y: 20 },
      pixelsPerSquare: 82,
      squareCount: 1
    };

    expect(getPixelsPerSquare(project)).toBe(82);
  });

  it('calculates pixels per square from a drawn calibration square', () => {
    const project = createEmptyBattlemapProject();
    project.calibration = {
      square: {
        x: 10,
        y: 20,
        width: 80,
        height: 84
      },
      squareCount: 1
    };

    expect(getCalibrationSquarePixels(project.calibration.square)).toBe(82);
    expect(getPixelsPerSquare(project)).toBe(82);
  });

  it('calculates pixels per square from a two-point calibration', () => {
    const project = createEmptyBattlemapProject();
    project.calibration = {
      start: { x: 10, y: 20 },
      end: { x: 70, y: 20 },
      squareCount: 1
    };

    expect(getPixelsPerSquare(project)).toBe(60);
  });

  it('converts calibrated pixels to true-scale millimeters', () => {
    expect(pixelsToMillimeters(300, 60)).toBe(127);
  });

  it('calculates crop offsets in print millimeters', () => {
    const offset = getRectCropOffset(
      {
        id: 'page-1',
        name: 'Page 1',
        x: 120,
        y: 60,
        width: 300,
        height: 240
      },
      60
    );

    expect(offset).toEqual({
      x: -50.8,
      y: -25.4
    });
  });

  it('calculates printed page rectangle dimensions', () => {
    const size = getRectPrintSize(
      {
        id: 'page-1',
        name: 'Page 1',
        x: 0,
        y: 0,
        width: 300,
        height: 240
      },
      60
    );

    expect(size).toEqual({
      width: 127,
      height: 101.6
    });
  });

  it('resizes page rectangles to preserve print size when pixels per inch changes', () => {
    const page = {
      id: 'page-1',
      name: 'Page 1',
      x: 10,
      y: 20,
      width: 140,
      height: 70
    };

    const resized = resizePagesForPixelsPerSquare([page], { width: 500, height: 500 }, 70, 140);

    expect(resized[0]).toEqual({
      ...page,
      width: 280,
      height: 140
    });
    expect(getRectPrintSize(resized[0], 140)).toEqual(getRectPrintSize(page, 70));
  });

  it('subtracts margins from paper size', () => {
    const project = createEmptyBattlemapProject();
    project.print.paperSize = { width: 210, height: 297 };
    project.print.margins = { top: 10, right: 15, bottom: 20, left: 25 };

    expect(getPrintablePaperSize(project.print)).toEqual({
      width: 170,
      height: 267
    });
  });

  it('uses landscape orientation before subtracting margins', () => {
    const project = createEmptyBattlemapProject();
    project.print.paperSize = { width: 210, height: 297 };
    project.print.orientation = 'landscape';
    project.print.margins = { top: 10, right: 15, bottom: 20, left: 25 };

    expect(getPrintablePaperSize(project.print)).toEqual({
      width: 257,
      height: 180
    });
  });

  it('generates initial pages from printable paper size without scaling the map', () => {
    const project = createEmptyBattlemapProject();
    project.imageSize = { width: 600, height: 240 };
    project.calibration = {
      start: { x: 0, y: 0 },
      end: { x: 60, y: 0 },
      squareCount: 1
    };
    project.print.paperSize = { width: 127, height: 101.6 };
    project.print.orientation = 'landscape';
    project.print.margins = { top: 0, right: 0, bottom: 0, left: 0 };

    const pages = createAutoBattlemapPages(project);

    expect(pages).toHaveLength(2);
    expect(pages.map((page) => [page.x, page.y, page.width, page.height])).toEqual([
      [0, 0, 300, 240],
      [300, 0, 300, 240]
    ]);
  });

  it('generates auto pages from oriented printable paper size', () => {
    const project = createEmptyBattlemapProject();
    project.imageSize = { width: 600, height: 240 };
    project.calibration = {
      start: { x: 0, y: 0 },
      end: { x: 60, y: 0 },
      squareCount: 1
    };
    project.print.paperSize = { width: 101.6, height: 127 };
    project.print.orientation = 'landscape';
    project.print.margins = { top: 0, right: 0, bottom: 0, left: 0 };

    const pages = createAutoBattlemapPages(project);

    expect(pages).toHaveLength(2);
    expect(pages.map((page) => [page.x, page.y, page.width, page.height])).toEqual([
      [0, 0, 300, 240],
      [300, 0, 300, 240]
    ]);
  });
});
