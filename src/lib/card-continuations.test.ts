import { describe, expect, it } from 'vitest';
import type Card from '$model/card';
import type { CardContent } from '$model/card';
import {
  createPrintableOutputEntries,
  expandCardToPrintableEntries,
  expandDeckToPrintableEntries
} from './card-continuations';

function createCard(contents: CardContent[], layout: Card['layout'] = {}): Card {
  return {
    count: 1,
    color: '#4a6898',
    title: 'Test Card',
    icon: 'magic-swirl',
    icon_back: 'magic-swirl',
    contents,
    tags: [],
    layout
  };
}

function countWords(value: string | undefined): number {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

describe('card continuations', () => {
  it('returns a single printable card when content already fits', async () => {
    const card = createCard([
      { type: 'text', content: 'one two', id: 'a' },
      { type: 'footer', content: 'Wizard | Level 1', id: 'b' }
    ]);

    const entries = await expandCardToPrintableEntries(card, 0, async () => true);

    expect(entries).toHaveLength(1);
    expect(entries[0].isContinuation).toBe(false);
    expect(entries[0].card.contents.at(-1)?.type).toBe('footer');
  });

  it('splits overflowing text blocks and repeats the footer on every continuation', async () => {
    const card = createCard([
      { type: 'text', content: 'one two three four', id: 'a' },
      { type: 'text', content: 'five six seven eight', id: 'b' },
      { type: 'footer', content: 'Wizard | Level 1', id: 'c' }
    ]);

    const entries = await expandCardToPrintableEntries(card, 0, async (candidate) => {
      const textWords = candidate.contents
        .filter((content) => content.type === 'text')
        .reduce((sum, content) => sum + countWords(content.content), 0);

      return textWords <= 5;
    });

    expect(entries).toHaveLength(2);
    expect(entries.every((entry) => entry.card.contents.at(-1)?.type === 'footer')).toBe(true);
    expect(entries[0].card.title).toBe('Test Card');
    expect(entries[1].card.title).toBe('Test Card');
  });

  it('keeps structural blocks whole and moves them to the next continuation card', async () => {
    const card = createCard([
      { type: 'text', content: 'one two', id: 'a' },
      { type: 'section', content: 'At higher levels', id: 'b' },
      { type: 'text', content: 'three four', id: 'c' }
    ]);

    const entries = await expandCardToPrintableEntries(card, 0, async (candidate) => {
      const nonFooterBlocks = candidate.contents.filter((content) => content.type !== 'footer');
      return nonFooterBlocks.length <= 2 && !nonFooterBlocks.some((content) => content.type === 'section' && nonFooterBlocks[0]?.type === 'text' && nonFooterBlocks.length > 1);
    });

    expect(entries).toHaveLength(2);
    expect(entries[0].card.contents.map((content) => content.type)).toEqual(['text']);
    expect(entries[1].card.contents.map((content) => content.type)).toEqual(['section', 'text']);
  });

  it('suppresses the implicit title on continuations when the source card uses a cardtitle block', async () => {
    const card = createCard(
      [
        { type: 'cardtitle', content: '', id: 'a' },
        { type: 'text', content: 'one two three four five', id: 'b' }
      ],
      { show_title: true }
    );

    const entries = await expandCardToPrintableEntries(card, 0, async (candidate) => {
      const nonFooterBlocks = candidate.contents.filter((content) => content.type !== 'footer');
      const textWords = candidate.contents
        .filter((content) => content.type === 'text')
        .reduce((sum, content) => sum + countWords(content.content), 0);

      return nonFooterBlocks.length <= 2 && textWords <= 2;
    });

    expect(entries).toHaveLength(2);
    expect(entries[0].card.layout.show_title).toBe(false);
    expect(entries[1].card.layout.show_title).toBe(false);
    expect(entries[0].card.contents.some((content) => content.type === 'cardtitle')).toBe(true);
    expect(entries[1].card.contents.some((content) => content.type === 'cardtitle')).toBe(false);
  });

  it('preserves oversized unsplittable blocks on their own continuation card', async () => {
    const card = createCard([{ type: 'property', content: 'Range | 120 feet', id: 'a' }]);

    const entries = await expandCardToPrintableEntries(card, 0, async () => false);

    expect(entries).toHaveLength(1);
    expect(entries[0].card.contents).toHaveLength(1);
    expect(entries[0].card.contents[0]?.type).toBe('property');
  });

  it('groups joined continuation pairs without affecting standalone overflow cards', async () => {
    const cards = [
      createCard(
        [{ type: 'text', content: 'one two three four five six', id: 'a' }],
        { pair_continuations: true }
      ),
      createCard([{ type: 'text', content: 'alpha beta', id: 'b' }])
    ];

    const entries = await expandDeckToPrintableEntries(cards, async (candidate) => {
      const textWords = candidate.contents
        .filter((content) => content.type === 'text')
        .reduce((sum, content) => sum + countWords(content.content), 0);

      return textWords <= 3;
    });
    const outputEntries = createPrintableOutputEntries(entries, 2);

    expect(outputEntries[0]).toMatchObject({
      type: 'joined-pair',
      span: 2
    });
    expect(outputEntries[1]).toMatchObject({
      type: 'single',
      span: 1
    });
  });
});
