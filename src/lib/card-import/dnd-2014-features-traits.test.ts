import { describe, expect, it, vi } from 'vitest';
import { createCardFromImportedDraft } from './card-import-factory';
import {
  adaptDnd2014FeatureToDraft,
  adaptDnd2014TraitToDraft,
  dnd2014FeaturesTraitsSource,
  parseDnd2014FeatureTraitGraphqlItems,
  parseDnd2014FeatureTraitListItems
} from './sources/dnd-2014-features-traits';

describe('D&D 2014 features and traits importer', () => {
  it('parses GraphQL feature and trait list entries into enriched selectable items', () => {
    const items = parseDnd2014FeatureTraitGraphqlItems({
      features: [
        {
          index: 'action-surge-1-use',
          name: 'Action Surge (1 use)',
          level: 2,
          class: {
            index: 'fighter',
            name: 'Fighter'
          }
        }
      ],
      traits: [
        {
          index: 'darkvision',
          name: 'Darkvision',
          races: [
            {
              index: 'dwarf',
              name: 'Dwarf'
            }
          ]
        }
      ]
    });

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.id)).toEqual([
      'feature:action-surge-1-use',
      'trait:darkvision'
    ]);
    expect(items[0]).toMatchObject({
      subtitle: 'Feature | Fighter level 2',
      detailUrl: 'https://www.dnd5eapi.co/api/2014/features/action-surge-1-use'
    });
    expect(items[0]?.searchText).toContain('fighter');
    expect(items[0]?.searchText).toContain('level 2');
    expect(items[1]).toMatchObject({
      subtitle: 'Trait | Dwarf'
    });
  });

  it('loads the overview with one GraphQL request', async () => {
    const fetchImpl = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          data: {
            features: [
              {
                index: 'brutal-critical-1-die',
                name: 'Brutal Critical',
                level: 9,
                class: {
                  index: 'barbarian',
                  name: 'Barbarian'
                }
              }
            ],
            traits: []
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });

    const result = await dnd2014FeaturesTraitsSource.loadItems(
      fetchImpl as unknown as typeof fetch
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe('https://www.dnd5eapi.co/graphql');
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST'
    });
    expect(result).toMatchObject({
      ok: true,
      data: [
        {
          id: 'feature:brutal-critical-1-die',
          title: 'Brutal Critical',
          subtitle: 'Feature | Barbarian level 9'
        }
      ]
    });
  });

  it('keeps REST-shaped list parsing as a minimal fallback helper', () => {
    const items = parseDnd2014FeatureTraitListItems(
      {
        results: [
          {
            index: 'action-surge-1-use',
            name: 'Action Surge (1 use)',
            url: '/api/2014/features/action-surge-1-use'
          }
        ]
      },
      {
        results: [
          {
            index: 'darkvision',
            name: 'Darkvision',
            url: '/api/2014/traits/darkvision'
          }
        ]
      }
    );

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.id)).toEqual([
      'feature:action-surge-1-use',
      'trait:darkvision'
    ]);
    expect(items[0]).toMatchObject({
      subtitle: 'Feature',
      detailUrl: 'https://www.dnd5eapi.co/api/2014/features/action-surge-1-use'
    });
    expect(items[1]?.searchText).toContain('trait');
  });

  it('adapts feature details into an ability draft', () => {
    const draft = adaptDnd2014FeatureToDraft({
      index: 'improved-critical',
      name: 'Improved Critical',
      class: {
        index: 'fighter',
        name: 'Fighter',
        url: '/api/2014/classes/fighter'
      },
      subclass: {
        index: 'champion',
        name: 'Champion',
        url: '/api/2014/subclasses/champion'
      },
      parent: {
        index: 'martial-archetype',
        name: 'Martial Archetype',
        url: '/api/2014/features/martial-archetype'
      },
      level: 3,
      prerequisites: [{ name: 'Fighter Level 3' }],
      desc: ['Your weapon attacks score a critical hit on a roll of 19 or 20.']
    });

    expect(draft.template).toBe('ability');
    expect(draft.tags).toEqual(
      expect.arrayContaining(['feature', 'class:fighter', 'subclass:champion', 'level:3'])
    );
    expect(draft.blocks).toContainEqual({
      type: 'property',
      content: 'Class | Fighter'
    });
    expect(draft.blocks).toContainEqual({
      type: 'property',
      content: 'Parent | Martial Archetype'
    });
    expect(draft.blocks).toContainEqual({
      type: 'property',
      content: 'Prerequisites | Fighter Level 3'
    });
    expect(draft.blocks.at(-1)).toMatchObject({
      type: 'footer',
      content: 'Fighter, Champion | Level 3 Feature'
    });
  });

  it('adapts trait details into an ability draft', () => {
    const draft = adaptDnd2014TraitToDraft({
      index: 'darkvision',
      name: 'Darkvision',
      races: [
        {
          index: 'dwarf',
          name: 'Dwarf',
          url: '/api/2014/races/dwarf'
        }
      ],
      subraces: [
        {
          index: 'hill-dwarf',
          name: 'Hill Dwarf',
          url: '/api/2014/subraces/hill-dwarf'
        }
      ],
      proficiencies: [
        {
          index: 'perception',
          name: 'Perception',
          url: '/api/2014/proficiencies/skill-perception'
        }
      ],
      proficiency_choices: {
        choose: 1,
        type: 'proficiencies'
      },
      language_options: {
        desc: 'Choose one extra language.'
      },
      desc: ['Accustomed to life underground, you have superior vision in dark and dim conditions.']
    });

    expect(draft.template).toBe('ability');
    expect(draft.tags).toEqual(
      expect.arrayContaining(['trait', 'race:dwarf', 'subrace:hill-dwarf'])
    );
    expect(draft.blocks).toContainEqual({
      type: 'property',
      content: 'Races | Dwarf'
    });
    expect(draft.blocks).toContainEqual({
      type: 'property',
      content: 'Proficiency choice | Choose 1 proficiencies'
    });
    expect(draft.blocks).toContainEqual({
      type: 'property',
      content: 'Language choice | Choose one extra language.'
    });
    expect(draft.blocks.at(-1)).toMatchObject({
      type: 'footer',
      content: 'Dwarf, Hill Dwarf | Racial Trait'
    });
  });

  it('creates ability cards with shared feature and trait defaults', () => {
    const draft = adaptDnd2014FeatureToDraft({
      index: 'action-surge-1-use',
      name: 'Action Surge (1 use)',
      class: {
        index: 'fighter',
        name: 'Fighter',
        url: '/api/2014/classes/fighter'
      },
      level: 2,
      desc: ['You can take one additional action on your turn.']
    });

    const card = createCardFromImportedDraft(draft);

    expect(card.color).toBe('#5f6f3f');
    expect(card.icon).toBe('scroll-quill');
    expect(card.icon_back).toBe('scroll-quill');
    expect(card.icon_back_top).toBe('');
    expect(card.icon_back_bottom).toBe('');
    expect(card.contents.at(-1)?.type).toBe('footer');
    expect(card.contents.some((content) => content.type === 'subtitle')).toBe(false);
  });
});
