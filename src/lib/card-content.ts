import type { CardContent } from '$model/card';
import { uuid4 } from './uuid';

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
