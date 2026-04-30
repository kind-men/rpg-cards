import { describe, expect, it } from 'vitest';
import { createCardFromImportedDraft } from './card-import-factory';
import {
  adaptDnd2014EquipmentToDraft,
  adaptDnd2014MagicItemToDraft
} from './sources/dnd-2014-items';

describe('D&D 2014 item importer', () => {
  it('adapts equipment into an item draft', () => {
    const draft = adaptDnd2014EquipmentToDraft({
      index: 'longsword',
      name: 'Longsword',
      equipment_category: {
        index: 'weapon',
        name: 'Weapon',
        url: '/api/2014/equipment-categories/weapon'
      },
      weapon_category: 'Martial',
      weapon_range: 'Melee',
      cost: { quantity: 15, unit: 'gp' },
      weight: 3,
      damage: {
        damage_dice: '1d8',
        damage_type: { name: 'Slashing' }
      },
      properties: [
        { index: 'versatile', name: 'Versatile', url: '/api/2014/weapon-properties/versatile' }
      ],
      desc: ['A martial melee weapon favored by knights and soldiers.']
    });

    expect(draft.template).toBe('item');
    expect(draft.tags).toContain('equipment');
    expect(draft.blocks[0]).toMatchObject({
      type: 'rule'
    });
    expect(draft.blocks).toContainEqual({
      type: 'property',
      content: 'Cost | 15 gp'
    });
    expect(draft.blocks.at(-1)).toMatchObject({
      type: 'footer',
      content: 'Martial | Weapon'
    });
  });

  it('adapts magic items with image cardbacks', () => {
    const draft = adaptDnd2014MagicItemToDraft({
      index: 'adamantine-armor',
      name: 'Adamantine Armor',
      equipment_category: {
        index: 'armor',
        name: 'Armor',
        url: '/api/2014/equipment-categories/armor'
      },
      rarity: { name: 'Uncommon' },
      image: '/images/magic-items/adamantine-armor.png',
      desc: ['Armor (medium or heavy, but not hide), uncommon.']
    });

    expect(draft.template).toBe('item');
    expect(draft.tags).toContain('magic-item');
    expect(draft.cardbackMode).toBe('images');
    expect(draft.cardbackImages).toEqual([
      {
        src: 'https://www.dnd5eapi.co/images/magic-items/adamantine-armor.png',
        size: 'cover'
      }
    ]);
    expect(draft.blocks.at(-1)).toMatchObject({
      type: 'footer',
      content: 'Armor | Uncommon'
    });
    expect(draft.blocks.some((block) => block.type === 'subtitle')).toBe(false);
  });

  it('creates item cards with image cardbacks from imported drafts', () => {
    const draft = adaptDnd2014MagicItemToDraft({
      index: 'potion-of-healing',
      name: 'Potion of Healing',
      equipment_category: {
        index: 'potion',
        name: 'Potion',
        url: '/api/2014/equipment-categories/potion'
      },
      rarity: { name: 'Common' },
      image: '/images/magic-items/potion-of-healing.png',
      desc: ['You regain 2d4 + 2 hit points when you drink this potion.']
    });

    const card = createCardFromImportedDraft(draft);

    expect(card.color).toBe('#7a5a3a');
    expect(card.icon).toBe('round-shield');
    expect(card.cardback_mode).toBe('images');
    expect(card.cardback_images).toEqual([
      {
        src: 'https://www.dnd5eapi.co/images/magic-items/potion-of-healing.png',
        size: 'cover'
      }
    ]);
    expect(card.cardback_border_style).toBe('none');
    expect(card.contents.at(-1)?.type).toBe('footer');
    expect(card.contents.some((content) => content.type === 'subtitle')).toBe(false);
  });
});
