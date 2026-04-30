import type { CardImportSource } from './types';
import { dnd2014SpellsSource } from './sources/dnd-2014-spells';

export const CARD_IMPORT_SOURCES: CardImportSource[] = [dnd2014SpellsSource];

export function getCardImportSource(sourceId: string): CardImportSource | undefined {
  return CARD_IMPORT_SOURCES.find((source) => source.id === sourceId);
}
