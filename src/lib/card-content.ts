import type { CardContent, FlatCardContent, RowCardContent } from '$model/card';
import { uuid4 } from './uuid';

export function isRowCardContent(content: CardContent): content is RowCardContent {
  return content.type === 'row';
}

export function isFlatCardContent(content: CardContent): content is FlatCardContent {
  return content.type !== 'row';
}

export function cloneCardContent(content: CardContent): CardContent {
  if (isRowCardContent(content)) {
    return {
      ...content,
      columns: content.columns.map((column) => column.map((columnContent) => cloneCardContent(columnContent)))
    };
  }

  return { ...content };
}

export function cloneCardContents(contents: CardContent[]): CardContent[] {
  return contents.map((content) => cloneCardContent(content));
}

export function cloneCardContentWithNewIds(content: CardContent): CardContent {
  if (isRowCardContent(content)) {
    return {
      ...content,
      id: uuid4(),
      columns: content.columns.map((column) =>
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

export function createEmptyRowCardContent(): RowCardContent {
  return {
    id: uuid4(),
    type: 'row',
    columns: [[], []]
  };
}

export function withContentIds(contents: CardContent[]): CardContent[] {
  return contents.map((content) => {
    if (isRowCardContent(content)) {
      return {
        ...content,
        id: content.id ?? uuid4(),
        columns: content.columns.map((column) => withContentIds(column))
      };
    }

    return {
      ...content,
      id: content.id ?? uuid4()
    };
  });
}
