import type { PaperFormat } from './page-layout';

export interface BattlemapPoint {
  x: number;
  y: number;
}

export interface BattlemapSize {
  width: number;
  height: number;
}

export interface BattlemapRect {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type BattlemapGridOverlay = 'none' | 'light' | 'dark';

export interface BattlemapCalibration {
  start?: BattlemapPoint;
  end?: BattlemapPoint;
  gridOrigin?: BattlemapPoint;
  squareCount: number;
}

export interface BattlemapPrintSettings {
  paperFormat: PaperFormat;
  paperSize: BattlemapSize;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  adjust: {
    x?: number;
    y?: number;
  };
  gridOverlay: BattlemapGridOverlay;
  showCropMarks: boolean;
  snapToGrid: boolean;
}

export default interface BattlemapProject {
  name: string;
  imageSrc: string;
  imageSize: BattlemapSize;
  calibration: BattlemapCalibration;
  print: BattlemapPrintSettings;
  pages: BattlemapRect[];
}
