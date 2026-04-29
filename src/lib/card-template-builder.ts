import { parseCards } from '$lib/card-json-parser';
import type Card from '$model/card';
import type { CardTemplateDefinition } from './card-templates';
import { DEFAULT_CARD_TEMPLATE } from './card-templates';
import { cloneCardContentsWithNewIds } from './card-content';

export interface CardTemplateParseOptions {
  convertFirstSubtitle: boolean;
  convertDndSpellblock: boolean;
}

export interface LoadCardTemplateOptions extends CardTemplateParseOptions {
  base?: string;
  fetchImpl?: typeof fetch;
}

export const cloneTemplateCard = (templateCard: Card, title = ''): Card => ({
  ...templateCard,
  title,
  tags: [...(templateCard.tags ?? [])],
  contents: cloneCardContentsWithNewIds(templateCard.contents ?? []),
  layout: { ...(templateCard.layout ?? {}) },
  cardback_images: (templateCard.cardback_images ?? []).map((image) => ({ ...image }))
});

export const createCardFromTemplate = (templateCard: Card, title = ''): Card =>
  cloneTemplateCard(templateCard, title);

export const createCardFromDefaultTemplate = (title = ''): Card =>
  createCardFromTemplate(DEFAULT_CARD_TEMPLATE, title);

export async function loadCardTemplate(
  templateDefinition: CardTemplateDefinition,
  { base = '', convertFirstSubtitle, convertDndSpellblock, fetchImpl = fetch }: LoadCardTemplateOptions
): Promise<Card | null> {
  if (templateDefinition.card) {
    return templateDefinition.card;
  }

  if (!templateDefinition.path) {
    return null;
  }

  const jsonText = await fetchImpl(`${base}${templateDefinition.path}`).then((res) => {
    if (!res.ok) {
      throw new Error(`Template request failed with ${res.status}`);
    }

    return res.text();
  });

  const [templateCard] = parseCards(jsonText, convertFirstSubtitle, convertDndSpellblock);
  return templateCard ?? null;
}
