import { describe, expect, it } from 'vitest';
import { collectCardIconNames, normalizeIconIndex } from './icons';
import type Card from '../model/card';

describe('icons', () => {
  it('normalizes duplicate icon names like the previous runtime map', () => {
    expect(
      normalizeIconIndex([
        { name: 'blade', path: 'weapons\\blade.svg' },
        { name: 'blade', path: 'other/blade.svg' },
        { name: 'blade', path: 'third/blade.svg' }
      ])
    ).toEqual([
      { name: 'blade', path: 'weapons/blade.svg' },
      { name: 'blade2', path: 'other/blade.svg' },
      { name: 'blade23', path: 'third/blade.svg' }
    ]);
  });

  it('collects unique front and cardback icon names from cards', () => {
    const cards = [
      {
        icon: 'front',
        icon_back: 'back',
        icon_back_top: 'top',
        icon_back_bottom: 'back'
      },
      {
        icon: 'front',
        icon_back: 'other-back',
        icon_back_top: '',
        icon_back_bottom: undefined
      }
    ] as Card[];

    expect(collectCardIconNames(cards)).toEqual(['front', 'back', 'top', 'other-back']);
  });
});
