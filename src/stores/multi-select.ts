import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import { currentCard } from '.';

function createMultiSelect() {
  let defaultValue = new Set<number>();
  if (browser) {
    defaultValue = new Set(
      JSON.parse(localStorage.getItem('multiSelect') ?? '[]') as Array<number>
    );
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

multiSelect.subscribe((current) => {
  if (browser) {
    localStorage.setItem('multiSelect', JSON.stringify(Array.from(current.values())));
  }

  const selectedCards = Array.from(current.values());

  if (current.size === 1) {
    currentCard.set(selectedCards[0]);
  } else if (current.size > 1 && !current.has(get(currentCard))) {
    currentCard.set(selectedCards[0]);
  } else if (current.size === 0) {
    currentCard.set(-1);
  }
});
