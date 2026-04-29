import type Card from '$model/card';
import defaultCardTemplate from '$lib/card-templates/default-card-template.json';

export interface CardTemplateDefinition {
  id: string;
  label: string;
  description: string;
  path?: string;
  card?: Card;
}

export const DEFAULT_CARD_TEMPLATE: Card = defaultCardTemplate as Card;

export const CARD_TEMPLATES: CardTemplateDefinition[] = [
  {
    id: 'scratch',
    label: 'Start from scratch',
    description: 'Begin with a simple starter card containing one text block.',
    card: DEFAULT_CARD_TEMPLATE
  },
  {
    id: 'spell',
    label: 'Spell Card',
    description: 'A spell-style starter with subtitle, properties, and rules text.',
    path: '/card-templates/spell-template.json'
  },
  {
    id: 'item',
    label: 'Item Card',
    description: 'An equipment-style starter with sections for traits and effects.',
    path: '/card-templates/item-template.json'
  },
  {
    id: 'character',
    label: 'Character Card',
    description: 'A character-style starter with role, stats, and abilities.',
    path: '/card-templates/character-template.json'
  }
];
