import { describe, expect, it } from 'vitest';
import { createMultiCard, removeEmpty } from './card-builder';
import type Card from '../model/card';

describe('card builder', () => {
  it('does not crash when multi-editing has no valid cards', () => {
    expect(createMultiCard([])).toEqual({});
  });

  it('does not recurse into null object values when creating a multi-card', () => {
    const first = {
      title: 'One',
      layout: null
    } as unknown as Card;
    const second = {
      title: 'Two',
      layout: null
    } as unknown as Card;

    expect(createMultiCard([first, second])).toEqual({
      title: null,
      layout: null
    });
  });

  it('does not crash when removing empty values from nullish input', () => {
    expect(removeEmpty(null)).toBeNull();
    expect(removeEmpty(undefined)).toBeUndefined();
  });
});
