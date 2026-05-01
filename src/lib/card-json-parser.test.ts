import { describe, expect, it } from 'vitest';
import type Card from '$model/card';
import { generateExportObject, parseCards } from './card-json-parser';

function createCard(title: string, imageSrc: string, size = 'contain'): Card {
  return {
    count: 1,
    color: '#4a6898',
    title,
    icon: 'magic-swirl',
    icon_back: 'magic-swirl',
    cardback_mode: 'images',
    cardback_images: [{ src: imageSrc, size }],
    cardback_background_color: '#ffffff',
    cardback_border_style: 'normal',
    contents: [],
    tags: [],
    layout: {}
  };
}

describe('card JSON parser', () => {
  it('exports shared cardback image data once and references it from cards', () => {
    const imageSrc = 'data:image/png;base64,abc123';
    const exportObject = generateExportObject([
      createCard('One', imageSrc, 'contain'),
      createCard('Two', imageSrc, 'cover')
    ]);

    expect(exportObject.version).toBe('2');
    expect(exportObject.images).toEqual([{ id: 'image-1', src: imageSrc }]);
    expect(exportObject.cards.map((card) => card.cardback_images)).toEqual([
      [{ image_id: 'image-1', size: 'contain' }],
      [{ image_id: 'image-1', size: 'cover' }]
    ]);
  });

  it('loads compact image references back into editable card images', () => {
    const cards = parseCards(
      JSON.stringify({
        version: '2',
        images: [{ id: 'image-1', src: 'data:image/png;base64,abc123' }],
        cards: [
          {
            ...createCard('One', ''),
            cardback_images: [{ image_id: 'image-1', size: 'cover' }]
          }
        ]
      })
    );

    expect(cards[0]?.cardback_images).toEqual([
      { src: 'data:image/png;base64,abc123', size: 'cover' }
    ]);
  });

  it('loads older duplicated image JSON and emits a deduplicated export', () => {
    const legacyJson = JSON.stringify({
      version: '1',
      cards: [
        createCard('One', 'data:image/png;base64,abc123'),
        createCard('Two', 'data:image/png;base64,abc123')
      ]
    });

    const cards = parseCards(legacyJson);
    const exportObject = generateExportObject(cards);

    expect(cards.map((card) => card.cardback_images?.[0]?.src)).toEqual([
      'data:image/png;base64,abc123',
      'data:image/png;base64,abc123'
    ]);
    expect(exportObject.images).toHaveLength(1);
    expect(exportObject.cards.map((card) => card.cardback_images?.[0]?.image_id)).toEqual([
      'image-1',
      'image-1'
    ]);
  });

  it('rejects non-deck JSON without throwing type guard errors', () => {
    expect(parseCards('null')).toEqual([]);
    expect(parseCards('{}')).toEqual([]);
  });
});
