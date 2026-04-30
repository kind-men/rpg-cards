import { createCardFromDefaultTemplate } from '$lib/card-template-builder';
import type { CardContent } from '$model/card';
import type Card from '$model/card';
import { uuid4 } from '$lib/uuid';
import type { ImportedCardDraft, ImportedCardDraftBlock } from './types';

const SPELL_CARD_DEFAULTS = {
  color: '#4a6898',
  icon: 'magic-swirl',
  iconBack: 'magic-swirl'
} as const;

const ITEM_CARD_DEFAULTS = {
  color: '#7a5a3a',
  icon: 'round-shield',
  iconBack: 'round-shield'
} as const;

function createContentBlock(block: ImportedCardDraftBlock): CardContent {
  return {
    id: uuid4(),
    type: block.type,
    content: block.content ?? '',
    verticalSpacing: block.verticalSpacing
  };
}

export function createCardFromImportedDraft(draft: ImportedCardDraft): Card {
  const card = createCardFromDefaultTemplate(draft.title);

  card.title = draft.title;
  card.tags = [...(draft.tags ?? [])];
  card.contents = draft.blocks.map((block) => createContentBlock(block));
  card.layout = {
    ...(card.layout ?? {}),
    ...(draft.layout ?? {})
  };
  card.cardback_mode = draft.cardbackMode ?? card.cardback_mode;
  card.cardback_images = (draft.cardbackImages ?? []).map((image) => ({ ...image }));
  card.cardback_background_color = draft.cardbackBackgroundColor ?? card.cardback_background_color;
  card.cardback_border_style = draft.cardbackBorderStyle ?? card.cardback_border_style;

  if (draft.template === 'spell') {
    card.color = draft.color ?? SPELL_CARD_DEFAULTS.color;
    card.icon = draft.icon ?? SPELL_CARD_DEFAULTS.icon;
    card.icon_back = draft.iconBack ?? SPELL_CARD_DEFAULTS.iconBack;
    return card;
  }

  if (draft.template === 'item') {
    card.color = draft.color ?? ITEM_CARD_DEFAULTS.color;
    card.icon = draft.icon ?? ITEM_CARD_DEFAULTS.icon;
    card.icon_back = draft.iconBack ?? ITEM_CARD_DEFAULTS.iconBack;
    return card;
  }

  if (draft.color) {
    card.color = draft.color;
  }

  if (draft.icon) {
    card.icon = draft.icon;
  }

  if (draft.iconBack) {
    card.icon_back = draft.iconBack;
  }

  return card;
}

export function createCardsFromImportedDrafts(drafts: ImportedCardDraft[]): Card[] {
  return drafts.map((draft) => createCardFromImportedDraft(draft));
}
