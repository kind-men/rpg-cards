import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type PageLayout from '../model/page-layout';
import type { CardFormat } from '../model/page-layout';
import type { PaperFormat } from '../model/page-layout';

const LOCALSTORAGE_KEY = 'pageLayout';

export const CARD_SIZE_PRESETS: Record<CardFormat, { width: number; height: number }> = {
  poker: {
    width: 63.5,
    height: 88.9
  },
  bridge: {
    width: 57.15,
    height: 88.9
  },
  tarot: {
    width: 70,
    height: 120
  },
  'square-1': {
    width: 25.4,
    height: 25.4
  },
  'square-2': {
    width: 50.8,
    height: 50.8
  },
  custom: {
    width: 63.5,
    height: 88.9
  }
};

export const PAPER_SIZE_PRESETS: Record<PaperFormat, { width: number; height: number }> = {
  a3: {
    width: 297,
    height: 420
  },
  a4: {
    width: 210,
    height: 297
  },
  a5: {
    width: 148,
    height: 210
  },
  letter: {
    width: 215.9,
    height: 279.4
  },
  legal: {
    width: 215.9,
    height: 355.6
  },
  custom: {
    width: 210,
    height: 297
  }
};

const defaultPageLayout: PageLayout = {
  paperFormat: 'a4',
  paperSize: {
    width: 210,
    height: 297
  },
  cardFormat: 'poker',
  cardSize: CARD_SIZE_PRESETS.poker,
  adjust: {
    x: undefined,
    y: undefined
  },
  cardBackBorder: 0
};

const areSameSize = (
  a: { width: number; height: number },
  b: { width: number; height: number },
  epsilon = 0.01
) => Math.abs(a.width - b.width) < epsilon && Math.abs(a.height - b.height) < epsilon;

const inferCardFormat = (cardSize?: { width?: number; height?: number }): CardFormat => {
  if (!cardSize?.width || !cardSize?.height) {
    return defaultPageLayout.cardFormat;
  }

  const matchingFormat = (
    Object.entries(CARD_SIZE_PRESETS) as [
      CardFormat,
      {
        width: number;
        height: number;
      }
    ][]
  ).find(([, preset]) => areSameSize(cardSize as { width: number; height: number }, preset));

  return matchingFormat?.[0] ?? defaultPageLayout.cardFormat;
};

const inferPaperFormat = (paperSize?: { width?: number; height?: number }): PaperFormat => {
  if (!paperSize?.width || !paperSize?.height) {
    return defaultPageLayout.paperFormat;
  }

  const matchingFormat = (
    Object.entries(PAPER_SIZE_PRESETS) as [
      PaperFormat,
      {
        width: number;
        height: number;
      }
    ][]
  )
    .filter(([format]) => format !== 'custom')
    .find(([, preset]) => areSameSize(paperSize as { width: number; height: number }, preset));

  return matchingFormat?.[0] ?? 'custom';
};

const normalizePageLayout = (layout: Partial<PageLayout> | null | undefined): PageLayout => {
  const paperFormat = layout?.paperFormat ?? inferPaperFormat(layout?.paperSize);
  const paperSize =
    paperFormat === 'custom'
      ? {
          width: layout?.paperSize?.width ?? defaultPageLayout.paperSize.width,
          height: layout?.paperSize?.height ?? defaultPageLayout.paperSize.height
        }
      : PAPER_SIZE_PRESETS[paperFormat];
  const cardFormat = layout?.cardFormat ?? inferCardFormat(layout?.cardSize);
  const cardSize =
    cardFormat === 'custom'
      ? {
          width: layout?.cardSize?.width ?? defaultPageLayout.cardSize.width,
          height: layout?.cardSize?.height ?? defaultPageLayout.cardSize.height
        }
      : CARD_SIZE_PRESETS[cardFormat];

  return {
    ...defaultPageLayout,
    ...layout,
    paperFormat,
    paperSize,
    cardFormat,
    cardSize,
    adjust: {
      ...defaultPageLayout.adjust,
      ...layout?.adjust
    }
  };
};

const fromLocalStorage = browser
  ? normalizePageLayout(JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) ?? 'null'))
  : defaultPageLayout;

export const pageLayout = writable<PageLayout>(fromLocalStorage);

pageLayout.subscribe((layout) => {
  if (browser) {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(layout));
  }
});
