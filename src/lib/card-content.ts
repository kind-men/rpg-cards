import type { CardContent } from '$model/card';
import { getContentBlockDefaultVerticalSpacing } from '$lib/card-content-types';
import { uuid4 } from './uuid';

export const CONTENT_PADDING_MIN_STEP = 0;
export const CONTENT_PADDING_MAX_STEP = 7;
export const CONTENT_PADDING_REM_STEP = 0.125;

export function normalizeContentPaddingStep(value: unknown): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return CONTENT_PADDING_MIN_STEP;
  }

  return Math.min(
    CONTENT_PADDING_MAX_STEP,
    Math.max(CONTENT_PADDING_MIN_STEP, Math.round(numericValue))
  );
}

export function getContentVerticalSpacing(content: CardContent): number {
  if (content.verticalSpacing == null) {
    return getContentBlockDefaultVerticalSpacing(content.type);
  }

  return normalizeContentPaddingStep(content.verticalSpacing);
}

export function getContentVerticalSpacingRemValue(content: CardContent): number {
  return getContentVerticalSpacing(content) * CONTENT_PADDING_REM_STEP;
}

export function hasChildCollections(content: CardContent): boolean {
  return Array.isArray(content.children);
}

export function isContainerContent(content: CardContent): boolean {
  return content.type === 'row' || hasChildCollections(content);
}

export function getContentText(content: CardContent): string {
  return content.content ?? '';
}

export function setContentText(content: CardContent, value: string): CardContent {
  return {
    ...content,
    content: value
  };
}

export function getContentChildren(content: CardContent): CardContent[][] {
  return content.children ?? [];
}

export function cloneCardContent(content: CardContent): CardContent {
  if (hasChildCollections(content)) {
    return {
      ...content,
      children: getContentChildren(content).map((column) =>
        column.map((columnContent) => cloneCardContent(columnContent))
      )
    };
  }

  return { ...content };
}

export function cloneCardContents(contents: CardContent[]): CardContent[] {
  return contents.map((content) => cloneCardContent(content));
}

export function cloneCardContentWithNewIds(content: CardContent): CardContent {
  if (hasChildCollections(content)) {
    return {
      ...content,
      id: uuid4(),
      children: getContentChildren(content).map((column) =>
        column.map((columnContent) => cloneCardContentWithNewIds(columnContent))
      )
    };
  }

  return {
    ...content,
    id: uuid4()
  };
}

export function cloneCardContentsWithNewIds(contents: CardContent[]): CardContent[] {
  return contents.map((content) => cloneCardContentWithNewIds(content));
}

export function createEmptyRowCardContent(): CardContent {
  return {
    id: uuid4(),
    type: 'row',
    children: [[], []]
  };
}

export function withContentIds(contents: CardContent[]): CardContent[] {
  return contents.map((content) => {
    if (hasChildCollections(content)) {
      return {
        ...content,
        id: content.id ?? uuid4(),
        children: getContentChildren(content).map((column) => withContentIds(column))
      };
    }

    return {
      ...content,
      id: content.id ?? uuid4()
    };
  });
}
