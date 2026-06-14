import { describe, expect, it } from 'vitest';
import {
  createAutoBattlemapPages,
  createEmptyBattlemapProject,
  getPixelsPerSquare,
  getPrintablePaperSize,
  getRectCropOffset,
  getRectPrintSize,
  pixelsToMillimeters
} from './battlemap';

describe('battlemap print math', () => {
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

  it('subtracts margins from paper size', () => {
    const project = createEmptyBattlemapProject();
    project.print.paperSize = { width: 210, height: 297 };
    project.print.margins = { top: 10, right: 15, bottom: 20, left: 25 };

    expect(getPrintablePaperSize(project.print)).toEqual({
      width: 170,
      height: 267
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
    project.print.margins = { top: 0, right: 0, bottom: 0, left: 0 };

    const pages = createAutoBattlemapPages(project);

    expect(pages).toHaveLength(2);
    expect(pages.map((page) => [page.x, page.y, page.width, page.height])).toEqual([
      [0, 0, 300, 240],
      [300, 0, 300, 240]
    ]);
  });
});
