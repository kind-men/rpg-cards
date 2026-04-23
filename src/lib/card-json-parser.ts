import type Card from '../model/card';
import type { CardContent } from '../model/card';
import type { CardBackImage } from '../model/card';
import { SPLIT_REGEX } from './constants';
import { uuid4 } from './uuid';
import type { CardCollection } from '../model/card-collection';
import { isCardCollection } from '../model/card-collection';
import { isCardContentType } from '$lib/card-content-types';
import { isLegacyCard } from '$model/legacy-card';

export function parseCards(
  json: string,
  shouldConvertSubtitlePlusRuleToSection = false,
  shouldConvertDndSpellcardBlocks = false
): Card[] {
  const importObject = JSON.parse(json);
  let cards: Card[];

  if (isCardCollection(importObject)) {
    cards = importObject.cards;
  } else if (Array.isArray(importObject)) {
    cards = JSON.parse(json, (key, value: never) => transformer(key, value)) as Card[];
  } else if (typeof importObject === 'object' && isLegacyCard(importObject)) {
    cards = [JSON.parse(json, (key, value: never) => transformer(key, value)) as Card];
  } else {
    console.warn('Uknown import format!');
    return [];
  }

  cards.forEach((card) => {
    if (!card.layout) {
      card.layout = {};
    }

    if (!card.cardback_mode) {
      card.cardback_mode = 'icon';
    }

    card.cardback_images = normalizeCardbackImages(card.cardback_images);

    if (!card.cardback_background_color) {
      card.cardback_background_color = '#ffffff';
    }

    if (!card.cardback_border_style) {
      card.cardback_border_style = 'normal';
    }

    if (shouldConvertSubtitlePlusRuleToSection) {
      card.contents = convertSubtitlePlusRuleToSection(card.contents);
    }

    if (shouldConvertDndSpellcardBlocks) {
      card.contents = convertDndSpellBlock(card.contents);
    }
  });

  return cards;
}

export function normalizeCardbackImages(images: unknown): CardBackImage[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => {
      if (typeof image === 'string') {
        return {
          src: image,
          size: 'contain'
        } as CardBackImage;
      }

      if (image && typeof image === 'object') {
        const src = 'src' in image && typeof image.src === 'string' ? image.src : '';
        const size = 'size' in image && typeof image.size === 'string' ? image.size : 'contain';

        return {
          src,
          size
        } as CardBackImage;
      }

      return null;
    })
    .filter((image): image is CardBackImage => Boolean(image));
}

function convertSubtitlePlusRuleToSection(contents: CardContent[]): CardContent[] {
  let subtitleIndex = -1;
  const subtitleToSectionList: number[] = [];

  const newContents = [...contents];

  newContents.forEach((content, index) => {
    if (content.type === 'subtitle') {
      subtitleIndex = index;
    } else if (content.type === 'rule' && subtitleIndex + 1 === index) {
      subtitleToSectionList.push(subtitleIndex);
    }
  });

  subtitleToSectionList.forEach((index) => {
    newContents[index].type = 'section';
    newContents.splice(index + 1, 1);
  });

  return newContents;
}

function convertDndSpellBlock(contents: CardContent[]): CardContent[] {
  const newContents = [...contents];

  type Spellblock = {
    index: number;
    castingTime: string;
    range: string;
    components: string;
    duration: string;
  };

  const blocks: Spellblock[] = [];

  newContents.forEach((content, index) => {
    if (content.type === 'property') {
      if (
        newContents[index + 1].type === 'property' &&
        newContents[index + 2].type === 'property' &&
        newContents[index + 3].type === 'property'
      ) {
        if (
          newContents[index].content.split(SPLIT_REGEX)[0] === 'Casting Time' &&
          newContents[index + 1].content.split(SPLIT_REGEX)[0] === 'Range' &&
          newContents[index + 2].content.split(SPLIT_REGEX)[0] === 'Components' &&
          newContents[index + 3].content.split(SPLIT_REGEX)[0] === 'Duration'
        ) {
          const castingTime = newContents[index].content.split(SPLIT_REGEX)[1];
          const range = newContents[index + 1].content.split(SPLIT_REGEX)[1];
          const components = newContents[index + 2].content.split(SPLIT_REGEX)[1];
          const duration = newContents[index + 3].content.split(SPLIT_REGEX)[1];

          blocks.push({
            index,
            castingTime,
            components,
            duration,
            range
          });

          newContents.splice(index, 4);
        }
      }
    }
  });

  blocks.forEach((block, i) => {
    newContents.splice(block.index + i * 4, 0, {
      type: 'dndspellblock',
      content: [block.castingTime, block.range, block.components, block.duration].join(' | '),
      id: uuid4()
    });
  });

  return newContents;
}

function transformer(key: string, value: never) {
  if (key === 'contents') {
    return parseCardContents(value);
  }

  return value;
}

export function parseCardContents(value: string[]): CardContent[] {
  const mapped: CardContent[] = value?.map((element: string) => {
    // eslint-disable-next-line prefer-const
    let [type, ...content] = element.split(SPLIT_REGEX);

    if (!isCardContentType(type)) {
      // throw new CardContentError(`'${type}' is not a valid content type`)
      type = 'text';
    }

    return {
      type: type,
      content: content.join(' | ').replace(/(\\\\n)/g, '\n'),
      id: uuid4()
    } as CardContent;
  });

  return mapped;
}

export function getContentAsString(contents: CardContent[]): string {
  return contents
    ?.map((content) =>
      (content.content
        ? [content.type, content.content.replace(/\n/g, '\\\\n')]
        : [content.type]
      )?.join(' | ')
    )
    ?.join('\n');
}

export class CardContentError extends Error {}

export function generateExportObject(cards: Card[]): CardCollection {
  return {
    version: '1',
    cards
  };
}
