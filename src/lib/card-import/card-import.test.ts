import { describe, expect, it } from 'vitest';
import { createCardFromImportedDraft } from './card-import-factory';
import {
  adaptDnd2014SpellToDraft,
  buildDnd2014SpellFooterLeft,
  buildDnd2014SpellFooterRight,
  formatDnd2014SpellComponents,
  parseDnd2014SpellListItems
} from './sources/dnd-2014-spells';

describe('D&D 2014 spell importer', () => {
  it('parses spell list entries into selectable items', () => {
    const items = parseDnd2014SpellListItems({
      results: [
        {
          index: 'mage-hand',
          name: 'Mage Hand',
          url: '/api/2014/spells/mage-hand'
        },
        {
          index: 'acid-arrow',
          name: 'Acid Arrow',
          url: '/api/2014/spells/acid-arrow'
        }
      ]
    });

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.id)).toEqual(['acid-arrow', 'mage-hand']);
    expect(items[0]?.detailUrl).toBe('https://www.dnd5eapi.co/api/2014/spells/acid-arrow');
  });

  it('formats spell metadata for footer and components', () => {
    const spell = {
      index: 'message',
      name: 'Message',
      level: 0,
      school: { name: 'Evocation' },
      ritual: true,
      concentration: true,
      classes: [{ index: 'wizard', name: 'Wizard', url: '/api/classes/wizard' }],
      components: ['V', 'S', 'M'],
      material: 'a tiny bell and a piece of fine silver wire'
    };

    expect(buildDnd2014SpellFooterLeft(spell)).toBe('Wizard');
    expect(buildDnd2014SpellFooterRight(spell)).toBe('Evocation Cantrip');
    expect(formatDnd2014SpellComponents(spell)).toBe(
      'V, S, M (a tiny bell and a piece of fine silver wire)'
    );
  });

  it('adapts spell details into a normalized import draft', () => {
    const draft = adaptDnd2014SpellToDraft({
      index: 'acid-arrow',
      name: 'Acid Arrow',
      level: 2,
      school: { index: 'evocation', name: 'Evocation' },
      classes: [
        { index: 'wizard', name: 'Wizard', url: '/api/classes/wizard' },
        { index: 'sorcerer', name: 'Sorcerer', url: '/api/classes/sorcerer' }
      ],
      casting_time: '1 action',
      range: '90 feet',
      components: ['V', 'S', 'M'],
      material: 'powdered rhubarb leaf and an adder’s stomach',
      duration: 'Instantaneous',
      desc: [
        'A shimmering green arrow streaks toward a target within range and bursts in a spray of acid.'
      ],
      higher_level: [
        'When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d4 for each slot level above 2nd.'
      ]
    });

    expect(draft.title).toBe('Acid Arrow');
    expect(draft.template).toBe('spell');
    expect(draft.tags).toContain('school:evocation');
    expect(draft.tags).toContain('level:2');
    expect(draft.blocks[0]).toMatchObject({
      type: 'rule'
    });
    expect(draft.blocks[1]).toMatchObject({
      type: 'dndspellblock',
      content:
        '1 action | 90 feet | V, S, M (powdered rhubarb leaf and an adder’s stomach) | Instantaneous'
    });
    expect(draft.blocks.at(-1)).toMatchObject({
      type: 'footer',
      content: 'Wizard, Sorcerer | Evocation Level 2'
    });
    expect(draft.blocks.at(-3)).toMatchObject({
      type: 'section',
      content: 'At higher levels'
    });
  });

  it('keeps Prestidigitation bullet points together in one text block', () => {
    const draft = adaptDnd2014SpellToDraft({
      index: 'prestidigitation',
      name: 'Prestidigitation',
      desc: [
        'This spell is a minor magical trick that novice spellcasters use for practice.',
        '- You create a harmless sensory effect.',
        '- You light or snuff out a small flame.',
        '- You clean or soil an object.',
        'The effect lasts for up to 1 hour.'
      ]
    });

    expect(draft.blocks.filter((block) => block.type === 'text')).toEqual([
      {
        type: 'text',
        content: 'This spell is a minor magical trick that novice spellcasters use for practice.'
      },
      {
        type: 'text',
        content:
          '- You create a harmless sensory effect.\n- You light or snuff out a small flame.\n- You clean or soil an object.'
      },
      { type: 'text', content: 'The effect lasts for up to 1 hour.' }
    ]);
  });

  it('creates editable cards from imported drafts with spell defaults', () => {
    const draft = adaptDnd2014SpellToDraft({
      index: 'light',
      name: 'Light',
      level: 0,
      school: { index: 'evocation', name: 'Evocation' },
      classes: [{ index: 'wizard', name: 'Wizard', url: '/api/classes/wizard' }],
      casting_time: '1 action',
      range: 'Touch',
      components: ['V', 'M'],
      material: 'a firefly or phosphorescent moss',
      duration: '1 hour',
      desc: ['You touch one object that is no larger than 10 feet in any dimension.']
    });

    const card = createCardFromImportedDraft(draft);

    expect(card.title).toBe('Light');
    expect(card.color).toBe('#4a6898');
    expect(card.icon).toBe('magic-swirl');
    expect(card.icon_back).toBe('magic-swirl');
    expect(card.icon_back_top).toBe('');
    expect(card.icon_back_bottom).toBe('');
    expect(card.tags).toContain('spell');
    expect(card.contents.map((content) => content.type)).toEqual([
      'rule',
      'dndspellblock',
      'rule',
      'text',
      'footer'
    ]);
    expect(
      card.contents.every((content) => typeof content.id === 'string' && content.id.length > 0)
    ).toBe(true);
    expect(card.contents.some((content) => content.type === 'subtitle')).toBe(false);
  });
});
