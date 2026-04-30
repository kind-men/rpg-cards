import type { CardImportSource } from './types';
import { dnd2014ItemsSource } from './sources/dnd-2014-items';
import { dnd2014SpellsSource } from './sources/dnd-2014-spells';

export const CARD_IMPORT_SOURCES: CardImportSource[] = [dnd2014SpellsSource, dnd2014ItemsSource];

export function getCardImportSource(sourceId: string): CardImportSource | undefined {
  return CARD_IMPORT_SOURCES.find((source) => source.id === sourceId);
}
