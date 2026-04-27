import { browser } from '$app/env';
import { writable } from 'svelte/store';
import { currentCard } from '.';

function createMultiSelect() {
  let defaultValue = new Set<number>();
  if (browser) {
    defaultValue =
      new Set(JSON.parse(localStorage.getItem('multiSelect')) as Array<number>) ?? defaultValue;
  }

  const { subscribe, set, update } = writable<Set<number>>(defaultValue);

  return {
    subscribe,
    add: (...values: number[]) =>
      update((set) => {
        values.forEach((v) => set.add(v));
        return set;
      }),
    remove: (value: number) =>
      update((set) => {
        set.delete(value);
        return set;
      }),
    clear: () =>
      update((set) => {
        if (set) {
          set.clear();
        }

        return set;
      }),
    set
  };
}

export const multiSelect = createMultiSelect();
let isSyncingFromCurrentCard = false;

multiSelect.subscribe((current) => {
  if (browser) {
    localStorage.setItem('multiSelect', JSON.stringify(Array.from(current.values())));
  }

  if (isSyncingFromCurrentCard) {
    return;
  }

  if (current.size === 1) {
    currentCard.set(current.values().next().value);
  } else if (current.size === 0) {
    currentCard.set(-1);
  }
});

currentCard.subscribe((current) => {
  isSyncingFromCurrentCard = true;

  if (current > -1) {
    multiSelect.set(new Set([current]));
  } else if (current === -1) {
    multiSelect.set(new Set());
  }

  isSyncingFromCurrentCard = false;
});
