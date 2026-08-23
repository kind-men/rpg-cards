import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
  createEmptyBattlemapProject,
  defaultBattlemapPrintSettings,
  normalizeBattlemapProject
} from '../lib/battlemap';
import type BattlemapProject from '../model/battlemap';
import type { BattlemapPrintSettings } from '../model/battlemap';

const LOCALSTORAGE_KEY = 'battlemapPrintSettings';

const getInitialProject = (): BattlemapProject => {
  const project = createEmptyBattlemapProject();

  if (!browser) {
    return project;
  }

  try {
    const storedPrintSettings = JSON.parse(
      localStorage.getItem(LOCALSTORAGE_KEY) ?? 'null'
    ) as Partial<BattlemapPrintSettings> | null;

    return normalizeBattlemapProject({
      ...project,
      print: {
        ...project.print,
        ...storedPrintSettings
      }
    });
  } catch {
    return project;
  }
};

function createBattlemapProjectStore() {
  const { subscribe, set, update } = writable<BattlemapProject>(getInitialProject());

  return {
    subscribe,
    set: (project: BattlemapProject) => set(normalizeBattlemapProject(project)),
    reset: () => set(createEmptyBattlemapProject()),
    update: (updater: (project: BattlemapProject) => BattlemapProject) =>
      update((project) => normalizeBattlemapProject(updater(project)))
  };
}

export const battlemapProject = createBattlemapProjectStore();

battlemapProject.subscribe((project) => {
  if (browser) {
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({
        ...defaultBattlemapPrintSettings,
        ...project.print,
        paperSize: project.print.paperSize,
        orientation: project.print.orientation,
        margins: project.print.margins,
        adjust: project.print.adjust,
        gridOverlay: project.print.gridOverlay,
        gridOffset: project.print.gridOffset,
        showCropMarks: project.print.showCropMarks,
        snapToGrid: project.print.snapToGrid
      })
    );
  }
});
