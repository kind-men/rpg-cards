import type Card from '../model/card';
import type { CardBackImage, CardContent } from '../model/card';
import type { LegacyCard } from '../model/legacy-card';
import type { CardCollection } from '../model/card-collection';
import { isCardCollection } from '../model/card-collection';
import { isLegacyCard } from '$model/legacy-card';
import { isCardContentType } from '$lib/card-content-types';
import {
  getContentChildren,
  getContentText,
  hasChildCollections,
  isContainerContent,
  withContentIds
} from './card-content';
import { SPLIT_REGEX } from './constants';
import { uuid4 } from './uuid';

const RAW_CONTENT_INDENT = 2;

type RawContentContext = 'top' | 'column';
type ParseCardContentOptions = {
  allowNestedFooter?: boolean;
  strict?: boolean;
};
type RawLine = {
  indent: number;
  lineNumber: number;
  text: string;
};

export function parseCards(
  json: string,
  shouldConvertSubtitlePlusRuleToSection = false,
  shouldConvertDndSpellcardBlocks = false
): Card[] {
  const importObject = JSON.parse(json);
  let cards: Card[];

  if (isCardCollection(importObject)) {
    cards = importObject.cards.map((card) => normalizeCard(card));
  } else if (Array.isArray(importObject)) {
    cards = importObject.map((card) => normalizeCard(card as Card));
  } else if (typeof importObject === 'object' && isLegacyCard(importObject)) {
    cards = [normalizeLegacyCard(importObject)];
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
      card.contents = withContentIds(convertSubtitlePlusRuleToSection(card.contents));
    }

    if (shouldConvertDndSpellcardBlocks) {
      card.contents = withContentIds(convertDndSpellBlock(card.contents));
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

function normalizeLegacyCard(card: LegacyCard): Card {
  return normalizeCard({
    ...card,
    contents: parseCardContents(card.contents)
  } as Card);
}

function normalizeCard(card: Card): Card {
  return {
    ...card,
    contents: normalizeCardContentArray(card?.contents, { allowNestedFooter: true })
  };
}

function normalizeCardContentArray(
  contents: unknown,
  options: ParseCardContentOptions = {}
): CardContent[] {
  if (!Array.isArray(contents)) {
    return [];
  }

  if (contents.every((content) => typeof content === 'string')) {
    return parseCardContents(contents as string[], options);
  }

  const normalized = contents
    .map((content) => normalizeCardContentObject(content, options))
    .filter((content): content is CardContent => Boolean(content));

  return withContentIds(normalized);
}

function normalizeCardContentObject(
  content: unknown,
  options: ParseCardContentOptions = {}
): CardContent | null {
  if (!content || typeof content !== 'object') {
    return null;
  }

  const rawType = 'type' in content && typeof content.type === 'string' ? content.type : 'text';
  const id = 'id' in content && typeof content.id === 'string' ? content.id : uuid4();

  if (rawType === 'row') {
    const rawChildren =
      'children' in content && Array.isArray(content.children) ? content.children : [[], []];
    const children = rawChildren.map((column) =>
      normalizeCardContentArray(column, {
        ...options,
        allowNestedFooter: false
      }).filter((columnContent) => columnContent.type !== 'footer')
    );

    while (children.length < 2) {
      children.push([]);
    }

    return {
      id,
      type: 'row',
      children
    };
  }

  const type = isCardContentType(rawType) && rawType !== 'row' ? rawType : 'text';

  if (type === 'footer' && options.allowNestedFooter === false) {
    return null;
  }

  return {
    id,
    type,
    content: 'content' in content && typeof content.content === 'string' ? content.content : ''
  };
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
    const content = newContents[index];

    if (content) {
      newContents[index] = {
        ...content,
        type: 'section'
      };
      newContents.splice(index + 1, 1);
    }
  });

  return newContents;
}

function convertDndSpellBlock(contents: CardContent[]): CardContent[] {
  const newContents = [...contents];

  type Spellblock = {
    castingTime: string;
    components: string;
    duration: string;
    index: number;
    range: string;
  };

  const blocks: Spellblock[] = [];

  newContents.forEach((content, index) => {
    if (isContainerContent(content) || content.type !== 'property') {
      return;
    }

    const nextOne = newContents[index + 1];
    const nextTwo = newContents[index + 2];
    const nextThree = newContents[index + 3];

    if (
      !nextOne ||
      !nextTwo ||
      !nextThree ||
      isContainerContent(nextOne) ||
      isContainerContent(nextTwo) ||
      isContainerContent(nextThree)
    ) {
      return;
    }

    if (
      nextOne.type === 'property' &&
      nextTwo.type === 'property' &&
      nextThree.type === 'property'
    ) {
      if (
        getContentText(content).split(SPLIT_REGEX)[0] === 'Casting Time' &&
        getContentText(nextOne).split(SPLIT_REGEX)[0] === 'Range' &&
        getContentText(nextTwo).split(SPLIT_REGEX)[0] === 'Components' &&
        getContentText(nextThree).split(SPLIT_REGEX)[0] === 'Duration'
      ) {
        blocks.push({
          index,
          castingTime: getContentText(content).split(SPLIT_REGEX)[1],
          components: getContentText(nextTwo).split(SPLIT_REGEX)[1],
          duration: getContentText(nextThree).split(SPLIT_REGEX)[1],
          range: getContentText(nextOne).split(SPLIT_REGEX)[1]
        });

        newContents.splice(index, 4);
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

export function parseCardContents(
  value: string[],
  options: ParseCardContentOptions = {}
): CardContent[] {
  const lines = tokenizeRawContent(value);
  const state = { index: 0 };
  const contents = parseRawContentList(lines, state, 0, 'top', {
    allowNestedFooter: options.allowNestedFooter ?? true,
    strict: options.strict ?? true
  });

  if (state.index < lines.length) {
    throw new CardContentError(`Unexpected content on line ${lines[state.index].lineNumber}.`);
  }

  return withContentIds(contents);
}

function tokenizeRawContent(value: string[]): RawLine[] {
  return (value ?? [])
    .map((text, index) => ({
      lineNumber: index + 1,
      text: text ?? ''
    }))
    .filter(({ text }) => text.trim().length > 0)
    .map(({ lineNumber, text }) => {
      const indent = text.match(/^ */)?.[0].length ?? 0;

      if (indent % RAW_CONTENT_INDENT !== 0) {
        throw new CardContentError(
          `Line ${lineNumber} must use indentation in multiples of ${RAW_CONTENT_INDENT} spaces.`
        );
      }

      return {
        indent,
        lineNumber,
        text: text.trim()
      };
    });
}

function parseRawContentList(
  lines: RawLine[],
  state: { index: number },
  indent: number,
  context: RawContentContext,
  options: Required<ParseCardContentOptions>
): CardContent[] {
  const contents: CardContent[] = [];

  while (state.index < lines.length) {
    const line = lines[state.index];

    if (line.indent < indent) {
      break;
    }

    if (line.indent > indent) {
      throw new CardContentError(`Unexpected indentation on line ${line.lineNumber}.`);
    }

    if (line.text === 'column') {
      break;
    }

    contents.push(parseRawContentLine(lines, state, indent, context, options));
  }

  return contents;
}

function parseRawContentLine(
  lines: RawLine[],
  state: { index: number },
  indent: number,
  context: RawContentContext,
  options: Required<ParseCardContentOptions>
): CardContent {
  const line = lines[state.index];
  const [rawType, ...contentParts] = line.text.split(SPLIT_REGEX);

  if (rawType === 'row') {
    state.index += 1;
    return parseRawRow(lines, state, indent, options, line.lineNumber);
  }

  if (rawType === 'column') {
    throw new CardContentError(`Unexpected column declaration on line ${line.lineNumber}.`);
  }

  let type: CardContent['type'] | string = rawType;

  if (!isCardContentType(type) || type === 'row') {
    type = 'text';
  }

  if (type === 'footer' && context !== 'top' && !options.allowNestedFooter) {
    throw new CardContentError(
      `Footer is only allowed at the top level (line ${line.lineNumber}).`
    );
  }

  state.index += 1;

  return {
    id: uuid4(),
    type: type as CardContent['type'],
    content: contentParts.join(' | ').replace(/(\\\\n)/g, '\n')
  };
}

function parseRawRow(
  lines: RawLine[],
  state: { index: number },
  indent: number,
  options: Required<ParseCardContentOptions>,
  lineNumber: number
): CardContent {
  const columnIndent = indent + RAW_CONTENT_INDENT;
  const contentIndent = columnIndent + RAW_CONTENT_INDENT;
  const columns: CardContent[][] = [];

  while (state.index < lines.length) {
    const line = lines[state.index];

    if (line.indent < columnIndent) {
      break;
    }

    if (line.indent > columnIndent) {
      throw new CardContentError(`Expected a column declaration on line ${line.lineNumber}.`);
    }

    if (line.text !== 'column') {
      throw new CardContentError(`Expected "column" on line ${line.lineNumber}.`);
    }

    state.index += 1;
    columns.push(parseRawContentList(lines, state, contentIndent, 'column', options));
  }

  if (columns.length === 0) {
    throw new CardContentError(`Row on line ${lineNumber} must include at least one column.`);
  }

  while (columns.length < 2) {
    columns.push([]);
  }

  return {
    id: uuid4(),
    type: 'row',
    children: columns
  };
}

function serializeContent(content: CardContent, indent = 0): string[] {
  const padding = ' '.repeat(indent);

  if (hasChildCollections(content)) {
    return [
      `${padding}row`,
      ...getContentChildren(content).flatMap((column) => [
        `${padding}${' '.repeat(RAW_CONTENT_INDENT)}column`,
        ...column.flatMap((columnContent) =>
          serializeContent(columnContent, indent + RAW_CONTENT_INDENT * 2)
        )
      ])
    ];
  }

  return [
    `${padding}${content.type}${getContentText(content) ? ` | ${getContentText(content).replace(/\n/g, '\\\\n')}` : ''}`
  ];
}

export function getContentAsString(contents: CardContent[]): string {
  return contents?.flatMap((content) => serializeContent(content))?.join('\n');
}

export class CardContentError extends Error {}

export function generateExportObject(cards: Card[]): CardCollection {
  return {
    version: '1',
    cards
  };
}
