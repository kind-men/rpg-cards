import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { parseCards } from '$lib/card-json-parser';
import { preloadIconsForCards } from '$lib/icons';
import type Card from '../model/card';

let shouldPersistDeck = false;
let hasUserMutation = false;
let hasLoadedStoredDeck = false;

export const deckLoading = writable(false);

const preloadDeckIcons = (cards: Card[]) => {
  if (browser) {
    void preloadIconsForCards(cards);
  }
};

function createDeck() {
  const defaultValue: Card[] = [];
  const { subscribe, set, update } = writable<Card[]>(defaultValue);

  return {
    subscribe,
    loadStoredDeck: async () => {
      if (!browser || hasLoadedStoredDeck) {
        return;
      }

      hasLoadedStoredDeck = true;
      deckLoading.set(true);

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

      const storedDeck = localStorage.getItem('deck') ?? '[]';

      if (storedDeck.trim() === '[]') {
        shouldPersistDeck = true;
        deckLoading.set(false);
        return;
      }

      try {
        const parsedDeck = parseCards(storedDeck) ?? [];
        shouldPersistDeck = parsedDeck.length > 0;

        if (!hasUserMutation) {
          set(parsedDeck);
        }

        preloadDeckIcons(parsedDeck);
      } catch (err) {
        console.warn('Unable to load stored deck.', err);
        shouldPersistDeck = false;
      } finally {
        deckLoading.set(false);
      }
    },
    addCards: (...card: Card[]) => {
      let index = -1;
      hasUserMutation = true;
      shouldPersistDeck = true;
      update((deck) => {
        index = deck.length;
        return [...deck, ...card];
      });
      preloadDeckIcons(card);
      return index;
    },
    removeCards: (...indexes: number[]) => {
      hasUserMutation = true;
      shouldPersistDeck = true;
      update((deck) => deck.filter((_, i) => !indexes.includes(i)));
    },
    setCard: (index: number, card: Card) => {
      hasUserMutation = true;
      shouldPersistDeck = true;
      update((deck) => {
        deck.splice(index, 1, card);
        return deck;
      });
      preloadDeckIcons([card]);
    },
    set: (deck: Card[]) => {
      hasUserMutation = true;
      shouldPersistDeck = true;
      set(deck);
      preloadDeckIcons(deck);
    }
  };
}

export const deck = createDeck();

deck.subscribe((deck) => {
  if (browser && shouldPersistDeck) {
    localStorage.setItem('deck', JSON.stringify(deck));
  }
});
