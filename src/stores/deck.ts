import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { parseCards } from '$lib/card-json-parser';
import type Card from '../model/card';

let shouldPersistDeck = true;

function createDeck() {
  let defaultValue = [];
  if (browser) {
    const storedDeck = localStorage.getItem('deck') ?? '[]';
    try {
      defaultValue = parseCards(storedDeck) ?? [];
      shouldPersistDeck = storedDeck.trim() === '[]' || defaultValue.length > 0;
    } catch (err) {
      console.warn('Unable to load stored deck.', err);
      shouldPersistDeck = false;
      defaultValue = [];
    }
  }
  const { subscribe, set, update } = writable<Card[]>(defaultValue);

  return {
    subscribe,
    addCards: (...card: Card[]) => {
      let index = -1;
      shouldPersistDeck = true;
      update((deck) => {
        index = deck.length;
        return [...deck, ...card];
      });
      return index;
    },
    removeCards: (...indexes: number[]) => {
      shouldPersistDeck = true;
      update((deck) => deck.filter((_, i) => !indexes.includes(i)));
    },
    setCard: (index: number, card: Card) => {
      shouldPersistDeck = true;
      update((deck) => {
        deck.splice(index, 1, card);
        return deck;
      });
    },
    set: (deck: Card[]) => {
      shouldPersistDeck = true;
      set(deck);
    }
  };
}

export const deck = createDeck();

deck.subscribe((deck) => {
  if (browser && shouldPersistDeck) {
    localStorage.setItem('deck', JSON.stringify(deck));
  }
});
