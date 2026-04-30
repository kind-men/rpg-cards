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

  if (draft.template === 'spell') {
    card.color = draft.color ?? SPELL_CARD_DEFAULTS.color;
    card.icon = draft.icon ?? SPELL_CARD_DEFAULTS.icon;
    card.icon_back = draft.iconBack ?? SPELL_CARD_DEFAULTS.iconBack;
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
