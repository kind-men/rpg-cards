import type Card from '$model/card';
import type { CardContent } from '$model/card';
import { cloneCardContent } from './card-content';

export interface PrintableCardEntry {
  key: string;
  card: Card;
  sourceIndex: number;
  continuationIndex: number;
  continuationCount: number;
  isContinuation: boolean;
  joinPairKey?: string;
  joinPairPosition?: 'start' | 'end';
}

export interface PrintableOutputEntry {
  key: string;
  type: 'single' | 'joined-pair';
  cards: PrintableCardEntry[];
  span: number;
}

export type CardFitEvaluator = (card: Card) => Promise<boolean>;

const SPLITTABLE_CONTENT_TYPES = new Set<CardContent['type']>(['text']);

function hasExplicitCardTitle(card: Card): boolean {
  return card.contents.some((content) => content.type === 'cardtitle');
}

function cloneCardBase(card: Card): Card {
  return {
    ...card,
    tags: [...(card.tags ?? [])],
    layout: { ...(card.layout ?? {}) },
    cardback_images: (card.cardback_images ?? []).map((image) => ({ ...image })),
    contents: []
  };
}

function buildCandidateCard(
  card: Card,
  mainContents: CardContent[],
  footerContents: CardContent[],
  forceHideImplicitTitle = false
): Card {
  const candidate = cloneCardBase(card);
  if (forceHideImplicitTitle) {
    candidate.layout.show_title = false;
  }
  candidate.contents = [
    ...mainContents.map((content) => cloneCardContent(content)),
    ...footerContents.map((content) => cloneCardContent(content))
  ];
  return candidate;
}

function splitTextContentAtWordBoundary(
  content: CardContent,
  wordCount: number
): { head: CardContent; tail: CardContent } | null {
  const sourceText = content.content ?? '';
  const trimmedText = sourceText.trim();

  if (!trimmedText) {
    return null;
  }

  const words = trimmedText.split(/\s+/);

  if (wordCount <= 0 || wordCount >= words.length) {
    return null;
  }

  const headText = words.slice(0, wordCount).join(' ').trim();
  const tailText = words.slice(wordCount).join(' ').trim();

  if (!headText || !tailText) {
    return null;
  }

  return {
    head: {
      ...content,
      content: headText
    },
    tail: {
      ...content,
      content: tailText
    }
  };
}

async function splitTextContentToFit(
  card: Card,
  fixedContents: CardContent[],
  textContent: CardContent,
  footerContents: CardContent[],
  fitsCard: CardFitEvaluator,
  forceHideImplicitTitle = false
): Promise<{ head: CardContent; tail: CardContent } | null> {
  const text = (textContent.content ?? '').trim();

  if (!text) {
    return null;
  }

  const words = text.split(/\s+/);

  if (words.length < 2) {
    return null;
  }

  let low = 1;
  let high = words.length - 1;
  let bestSplit: { head: CardContent; tail: CardContent } | null = null;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const splitResult = splitTextContentAtWordBoundary(textContent, middle);

    if (!splitResult) {
      break;
    }

    const candidate = buildCandidateCard(
      card,
      [...fixedContents, splitResult.head],
      footerContents,
      forceHideImplicitTitle
    );

    if (await fitsCard(candidate)) {
      bestSplit = splitResult;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return bestSplit;
}

export async function expandCardToPrintableEntries(
  card: Card,
  sourceIndex: number,
  fitsCard: CardFitEvaluator
): Promise<PrintableCardEntry[]> {
  const baseCard = cloneCardBase(card);
  const footerContents = card.contents
    .filter((content) => content.type === 'footer')
    .map((content) => ({ ...content }));
  const mainContents = card.contents
    .filter((content) => content.type !== 'footer')
    .map((content) => ({ ...content }));
  const explicitTitle = hasExplicitCardTitle(card);
  const forceHideImplicitTitle = explicitTitle;

  if (mainContents.length === 0) {
    const singleCard = buildCandidateCard(baseCard, [], footerContents, forceHideImplicitTitle);
    return [
      {
        key: `${sourceIndex}-0`,
        card: singleCard,
        sourceIndex,
        continuationIndex: 0,
        continuationCount: 1,
        isContinuation: false
      }
    ];
  }

  const generatedCards: Card[] = [];
  let currentContents: CardContent[] = [];
  let contentIndex = 0;

  while (contentIndex < mainContents.length) {
    const content = mainContents[contentIndex];
    const candidate = buildCandidateCard(
      baseCard,
      [...currentContents, content],
      footerContents,
      forceHideImplicitTitle
    );

    if (await fitsCard(candidate)) {
      currentContents.push(content);
      contentIndex += 1;
      continue;
    }

    if (SPLITTABLE_CONTENT_TYPES.has(content.type)) {
      const splitResult = await splitTextContentToFit(
        baseCard,
        currentContents,
        content,
        footerContents,
        fitsCard,
        forceHideImplicitTitle
      );

      if (splitResult) {
        currentContents.push(splitResult.head);
        generatedCards.push(
          buildCandidateCard(baseCard, currentContents, footerContents, forceHideImplicitTitle)
        );
        currentContents = [splitResult.tail];
        contentIndex += 1;
        continue;
      }
    }

    if (currentContents.length === 0) {
      generatedCards.push(
        buildCandidateCard(baseCard, [content], footerContents, forceHideImplicitTitle)
      );
      contentIndex += 1;
      continue;
    }

    generatedCards.push(
      buildCandidateCard(baseCard, currentContents, footerContents, forceHideImplicitTitle)
    );
    currentContents = [];
  }

  if (currentContents.length > 0 || generatedCards.length === 0) {
    generatedCards.push(
      buildCandidateCard(baseCard, currentContents, footerContents, forceHideImplicitTitle)
    );
  }

  const continuationCount = generatedCards.length;

  return generatedCards.map((generatedCard, index) => ({
    key: `${sourceIndex}-${index}`,
    card: generatedCard,
    sourceIndex,
    continuationIndex: index,
    continuationCount,
    isContinuation: continuationCount > 1
  }));
}

export async function expandDeckToPrintableEntries(
  cards: Card[],
  fitsCard: CardFitEvaluator
): Promise<PrintableCardEntry[]> {
  const expandedEntries: PrintableCardEntry[] = [];

  for (const [index, card] of cards.entries()) {
    const nextEntries = await expandCardToPrintableEntries(card, index, fitsCard);
    expandedEntries.push(...applyContinuationPairing(nextEntries, card.layout?.pair_continuations === true));
  }

  return expandedEntries;
}

export function applyContinuationPairing(
  entries: PrintableCardEntry[],
  enabled: boolean
): PrintableCardEntry[] {
  const pairedEntries = entries.map((entry) => ({
    ...entry,
    joinPairKey: undefined,
    joinPairPosition: undefined
  }));

  if (!enabled || pairedEntries.length <= 1) {
    return pairedEntries;
  }

  pairedEntries.forEach((entry, index) => {
    if (index + 1 >= pairedEntries.length && index % 2 === 0) {
      return;
    }

    entry.joinPairKey = `${entry.sourceIndex}:${Math.floor(index / 2)}`;
    entry.joinPairPosition = index % 2 === 0 ? 'start' : 'end';
  });

  return pairedEntries;
}

export function createPrintableOutputEntries(
  printableCards: PrintableCardEntry[],
  availableColumns: number
): PrintableOutputEntry[] {
  const outputEntries: PrintableOutputEntry[] = [];

  for (let index = 0; index < printableCards.length; index += 1) {
    const current = printableCards[index];
    const next = printableCards[index + 1];
    const canJoin =
      availableColumns >= 2 &&
      current.joinPairKey &&
      current.joinPairPosition === 'start' &&
      next?.joinPairKey === current.joinPairKey &&
      next.joinPairPosition === 'end';

    if (canJoin && next) {
      outputEntries.push({
        key: `joined-${current.joinPairKey}`,
        type: 'joined-pair',
        cards: [current, next],
        span: 2
      });
      index += 1;
      continue;
    }

    outputEntries.push({
      key: `single-${current.key}`,
      type: 'single',
      cards: [current],
      span: 1
    });
  }

  return outputEntries;
}

export function getPrintableEntryCards(
  entry: PrintableOutputEntry,
  side: 'front' | 'back'
): PrintableCardEntry[] {
  return side === 'back' && entry.type === 'joined-pair' ? [...entry.cards].reverse() : entry.cards;
}
