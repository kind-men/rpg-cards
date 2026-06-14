import { base } from '$app/paths';
import type Card from '../model/card';

export type Icon = {
  name: string;
  path: string;
};

type RawIcon = {
  name?: unknown;
  path?: unknown;
};

let iconIndexPromise: Promise<Icon[]> | null = null;
let iconMapPromise: Promise<Map<string, Icon>> | null = null;
const svgCache = new Map<string, Promise<string | null>>();

const normalizeIconPath = (path: string) => path.replace(/\\/g, '/');

const toIconUrl = (path: string) => {
  const encodedPath = normalizeIconPath(path).split('/').map(encodeURIComponent).join('/');
  return `${base}/icons/${encodedPath}`;
};

export const normalizeIconIndex = (icons: RawIcon[]): Icon[] => {
  const names = new Set<string>();

  return icons
    .filter(
      (icon): icon is { name: string; path: string } =>
        typeof icon.name === 'string' && typeof icon.path === 'string'
    )
    .map((icon) => {
      const baseName = icon.name;
      let name = baseName;
      let count = 2;

      while (names.has(name)) {
        name = `${name}${count}`;
        count += 1;
      }

      names.add(name);
      return {
        name,
        path: normalizeIconPath(icon.path)
      };
    });
};

const loadIconIndex = async (): Promise<Icon[]> => {
  if (!iconIndexPromise) {
    iconIndexPromise = fetch(`${base}/icons/icons.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load icon index: ${response.status}`);
        }

        return response.json() as Promise<RawIcon[]>;
      })
      .then(normalizeIconIndex)
      .catch((error) => {
        console.warn('Unable to load icon index.', error);
        return [];
      });
  }

  return iconIndexPromise;
};

const loadIconMap = async (): Promise<Map<string, Icon>> => {
  if (!iconMapPromise) {
    iconMapPromise = loadIconIndex().then((icons) => {
      const iconMap = new Map<string, Icon>();
      icons.forEach((icon) => iconMap.set(icon.name, icon));
      return iconMap;
    });
  }

  return iconMapPromise;
};

export const getIcon = async (name: string | null | undefined): Promise<Icon | null> => {
  if (!name) {
    return null;
  }

  const iconMap = await loadIconMap();
  return iconMap.get(name) ?? null;
};

export const getIconSvg = async (name: string | null | undefined): Promise<string | null> => {
  if (!name) {
    return null;
  }

  if (!svgCache.has(name)) {
    svgCache.set(
      name,
      (async () => {
        const icon = await getIcon(name);

        if (!icon) {
          return null;
        }

        try {
          const response = await fetch(toIconUrl(icon.path));

          if (!response.ok) {
            return null;
          }

          return await response.text();
        } catch (error) {
          console.warn(`Unable to load icon "${name}".`, error);
          return null;
        }
      })()
    );
  }

  return svgCache.get(name) ?? null;
};

export const getAllIconNames = async (query?: string): Promise<string[]> => {
  const icons = await loadIconIndex();
  const normalizedQuery = query?.trim().toLowerCase();

  return icons
    .filter((icon) => (normalizedQuery ? icon.name.toLowerCase().includes(normalizedQuery) : true))
    .map((icon) => icon.name);
};

export const collectCardIconNames = (cards: Card[]): string[] => {
  const iconNames = new Set<string>();

  cards.forEach((card) => {
    [card.icon, card.icon_back, card.icon_back_top, card.icon_back_bottom].forEach((iconName) => {
      if (iconName) {
        iconNames.add(iconName);
      }
    });
  });

  return Array.from(iconNames);
};

export const preloadIcons = async (
  iconNames: Iterable<string | null | undefined>
): Promise<void> => {
  await Promise.all(Array.from(iconNames).map((iconName) => getIconSvg(iconName)));
};

export const preloadIconsForCards = (cards: Card[]): Promise<void> =>
  preloadIcons(collectCardIconNames(cards));
