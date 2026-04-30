import type { CardContentType } from '$lib/card-content-types';
import type Card from '$model/card';
import type { CardBackBorderStyle, CardBackImage, CardBackMode } from '$model/card';

export interface CardImportError {
  code: 'network' | 'parse' | 'empty' | 'unknown';
  message: string;
  cause?: unknown;
}

export type CardImportResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: CardImportError;
    };

export interface CardImportListItem {
  id: string;
  title: string;
  detailUrl: string;
  subtitle?: string;
  searchText?: string;
}

export interface ImportedCardDraftBlock {
  type: Exclude<CardContentType, 'cardtitle' | 'row'>;
  content?: string;
  verticalSpacing?: number;
}

export interface ImportedCardDraft {
  sourceId: string;
  externalId: string;
  title: string;
  tags: string[];
  template?: 'default' | 'spell' | 'item';
  icon?: string;
  iconBack?: string;
  color?: string;
  layout?: Partial<Card['layout']>;
  cardbackMode?: CardBackMode;
  cardbackImages?: CardBackImage[];
  cardbackBackgroundColor?: string;
  cardbackBorderStyle?: CardBackBorderStyle;
  blocks: ImportedCardDraftBlock[];
}

export interface CardImportSource {
  id: string;
  label: string;
  description: string;
  loadItems(fetchImpl?: typeof fetch): Promise<CardImportResult<CardImportListItem[]>>;
  importItems(
    items: CardImportListItem[],
    fetchImpl?: typeof fetch
  ): Promise<CardImportResult<ImportedCardDraft[]>>;
}
