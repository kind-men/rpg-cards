export interface CardTemplateDefinition {
  id: string;
  label: string;
  description: string;
  path: string;
}

export const CARD_TEMPLATES: CardTemplateDefinition[] = [
  {
    id: 'scratch',
    label: 'Start from scratch',
    description: 'Begin with a simple starter card containing one text block.',
    path: '/card-templates/scratch-template.json'
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
