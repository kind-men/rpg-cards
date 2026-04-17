import { browser } from '$app/env';
import { writable } from 'svelte/store';
import type PageLayout from '../model/page-layout';
import type { CardFormat } from '../model/page-layout';

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
  custom: {
    width: 63.5,
    height: 88.9
  }
};

const defaultPageLayout: PageLayout = {
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

  const matchingFormat = (Object.entries(CARD_SIZE_PRESETS) as [CardFormat, {
    width: number;
    height: number;
  }][]).find(([, preset]) => areSameSize(cardSize as { width: number; height: number }, preset));

  return matchingFormat?.[0] ?? defaultPageLayout.cardFormat;
};

const normalizePageLayout = (layout: Partial<PageLayout> | null | undefined): PageLayout => {
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
    paperSize: {
      ...defaultPageLayout.paperSize,
      ...layout?.paperSize
    },
    cardFormat,
    cardSize,
    adjust: {
      ...defaultPageLayout.adjust,
      ...layout?.adjust
    }
  };
};

const fromLocalStorage = browser
  ? normalizePageLayout(JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)))
  : defaultPageLayout;

export const pageLayout = writable<PageLayout>(fromLocalStorage);

pageLayout.subscribe((layout) => {
  if (browser) {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(layout));
  }
});
