import type { CardImportSource } from './types';
import { dnd2014FeaturesTraitsSource } from './sources/dnd-2014-features-traits';
import { dnd2014ItemsSource } from './sources/dnd-2014-items';
import { dnd2014SpellsSource } from './sources/dnd-2014-spells';

export const CARD_IMPORT_SOURCES: CardImportSource[] = [
  dnd2014SpellsSource,
  dnd2014ItemsSource,
  dnd2014FeaturesTraitsSource
];

export function getCardImportSource(sourceId: string): CardImportSource | undefined {
  return CARD_IMPORT_SOURCES.find((source) => source.id === sourceId);
}
