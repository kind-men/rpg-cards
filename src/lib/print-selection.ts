import { browser } from '$app/environment';
import type Card from '../model/card';

const PRINT_SELECTION_KEY = 'printSelection';

const normalizeSelection = (selection: number[] | null | undefined): number[] | null => {
  if (!selection || selection.length === 0) {
    return null;
  }

  const normalized = Array.from(
    new Set(
      selection
        .filter((value) => Number.isInteger(value) && value >= 0)
        .map((value) => Number(value))
    )
  );

  return normalized.length > 0 ? normalized : null;
};

export const getPrintSelection = (): number[] | null => {
  if (!browser) {
    return null;
  }

  try {
    return normalizeSelection(JSON.parse(localStorage.getItem(PRINT_SELECTION_KEY) ?? 'null'));
  } catch {
    return null;
  }
};

export const setPrintSelection = (selection: number[] | null | undefined) => {
  if (!browser) {
    return;
  }

  const normalized = normalizeSelection(selection);

  if (!normalized) {
    localStorage.removeItem(PRINT_SELECTION_KEY);
    return;
  }

  localStorage.setItem(PRINT_SELECTION_KEY, JSON.stringify(normalized));
};

export const getPrintableCards = (cards: Card[]): Card[] => {
  const selection = getPrintSelection();

  if (!selection) {
    return cards;
  }

  return selection.map((index) => cards[index]).filter(Boolean);
};
