import type Card from './card';
import type { CardBackImage } from './card';

export interface CardImageAsset {
  id: string;
  src: string;
}

export interface ExportedCardBackImage extends Omit<CardBackImage, 'src'> {
  src?: string;
  image_id?: string;
}

export type ExportedCard = Omit<Card, 'cardback_images'> & {
  cardback_images?: ExportedCardBackImage[];
};

export interface CardCollection {
  version: string;
  images?: CardImageAsset[];
  cards: ExportedCard[];
}

export function isCardCollection(collection: unknown): collection is CardCollection {
  return (
    Boolean(collection) &&
    typeof collection === 'object' &&
    'cards' in collection &&
    Array.isArray(collection.cards) &&
    'version' in collection &&
    typeof collection.version === 'string'
  );
}
