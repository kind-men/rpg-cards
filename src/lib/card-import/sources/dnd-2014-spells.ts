import type {
  CardImportError,
  CardImportListItem,
  CardImportResult,
  CardImportSource,
  ImportedCardDraft
} from '$lib/card-import/types';

const DND_API_ORIGIN = 'https://www.dnd5eapi.co';
const DND_2014_SPELLS_ENDPOINT = `${DND_API_ORIGIN}/api/2014/spells/`;

interface DndApiReference {
  index: string;
  name: string;
  url: string;
}

interface Dnd2014SpellListResponse {
  count?: number;
  results?: DndApiReference[];
}

interface Dnd2014SpellDetailResponse {
  index: string;
  name: string;
  desc?: string[];
  higher_level?: string[];
  range?: string;
  components?: string[];
  material?: string;
  ritual?: boolean;
  duration?: string;
  concentration?: boolean;
  casting_time?: string;
  level?: number;
  classes?: DndApiReference[];
  school?: {
    index?: string;
    name?: string;
  };
}

function createImportError(
  code: CardImportError['code'],
  message: string,
  cause?: unknown
): CardImportError {
  return { code, message, cause };
}

function toSuccess<T>(data: T): CardImportResult<T> {
  return { ok: true, data };
}

function toFailure<T>(error: CardImportError): CardImportResult<T> {
  return { ok: false, error };
}

function resolveApiUrl(url: string): string {
  return new URL(url, DND_API_ORIGIN).toString();
}

async function fetchJson<T>(url: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw createImportError('network', `Request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export function parseDnd2014SpellListItems(
  response: Dnd2014SpellListResponse
): CardImportListItem[] {
  const results = Array.isArray(response?.results) ? response.results : [];

  return results
    .filter((item) => item?.index && item?.name && item?.url)
    .map((item) => ({
      id: item.index,
      title: item.name,
      detailUrl: resolveApiUrl(item.url),
      searchText: `${item.name} ${item.index}`.toLowerCase()
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function formatLevel(level?: number): string {
  if (level === 0) {
    return 'Cantrip';
  }

  if (typeof level === 'number' && Number.isFinite(level)) {
    return `Level ${level}`;
  }

  return 'Spell';
}

export function formatDnd2014SpellComponents(spell: Dnd2014SpellDetailResponse): string {
  const parts = Array.isArray(spell.components) ? [...spell.components] : [];

  if (spell.material) {
    return `${parts.join(', ')} (${spell.material})`;
  }

  return parts.join(', ');
}

export function buildDnd2014SpellFooterLeft(spell: Dnd2014SpellDetailResponse): string {
  return (spell.classes ?? [])
    .map((characterClass) => characterClass?.name?.trim())
    .filter(Boolean)
    .join(', ');
}

export function buildDnd2014SpellFooterRight(spell: Dnd2014SpellDetailResponse): string {
  const school = spell.school?.name?.trim();
  const level = formatLevel(spell.level);

  return [school, level].filter(Boolean).join(' ');
}

function descriptionToTextBlocks(desc?: string[]): ImportedCardDraft['blocks'] {
  const blocks: ImportedCardDraft['blocks'] = [];
  let listItems: string[] = [];

  const addList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'text', content: listItems.join('\n') });
      listItems = [];
    }
  };

  for (const paragraph of desc ?? []) {
    if (/^\s*(?:[-+*]|\d+[.)])\s+/.test(paragraph)) {
      listItems.push(paragraph);
      continue;
    }

    addList();
    blocks.push({ type: 'text', content: paragraph });
  }

  addList();
  return blocks;
}

export function adaptDnd2014SpellToDraft(spell: Dnd2014SpellDetailResponse): ImportedCardDraft {
  if (!spell?.index || !spell?.name) {
    throw createImportError('parse', 'Spell response is missing required fields.');
  }

  const tags = [
    'imported',
    'dnd-2014',
    'spell',
    `source:${DND_2014_SPELLS_SOURCE_ID}`,
    `level:${spell.level === 0 ? 'cantrip' : String(spell.level ?? 'unknown')}`
  ];

  if (spell.school?.index) {
    tags.push(`school:${spell.school.index}`);
  }

  const blocks: ImportedCardDraft['blocks'] = [
    {
      type: 'rule'
    },
    {
      type: 'dndspellblock',
      content: [
        spell.casting_time ?? '',
        spell.range ?? '',
        formatDnd2014SpellComponents(spell),
        spell.duration ?? '',
        spell.concentration ? 'true' : 'false'
      ].join(' | ')
    },
    {
      type: 'rule'
    },
    ...descriptionToTextBlocks(spell.desc)
  ];

  if (Array.isArray(spell.higher_level) && spell.higher_level.length > 0) {
    blocks.push({
      type: 'section',
      content: 'At higher levels'
    });

    blocks.push(...descriptionToTextBlocks(spell.higher_level));
  }

  blocks.push({
    type: 'footer',
    content: `${buildDnd2014SpellFooterLeft(spell)} | ${buildDnd2014SpellFooterRight(spell)}`
  });

  return {
    sourceId: DND_2014_SPELLS_SOURCE_ID,
    externalId: spell.index,
    title: spell.name,
    tags,
    template: 'spell',
    blocks,
    layout: {
      show_title: true
    }
  };
}

async function loadDnd2014SpellItems(
  fetchImpl: typeof fetch
): Promise<CardImportResult<CardImportListItem[]>> {
  try {
    const response = await fetchJson<Dnd2014SpellListResponse>(DND_2014_SPELLS_ENDPOINT, fetchImpl);
    const items = parseDnd2014SpellListItems(response);

    if (items.length === 0) {
      return toFailure(createImportError('empty', 'No spells were returned by the source.'));
    }

    return toSuccess(items);
  } catch (error) {
    return toFailure(
      'code' in (error as object) && 'message' in (error as object)
        ? (error as CardImportError)
        : createImportError('network', 'Unable to load spells from the source.', error)
    );
  }
}

async function importDnd2014SpellItems(
  items: CardImportListItem[],
  fetchImpl: typeof fetch
): Promise<CardImportResult<ImportedCardDraft[]>> {
  if (items.length === 0) {
    return toFailure(createImportError('empty', 'Select at least one spell to import.'));
  }

  try {
    const spells = await Promise.all(
      items.map(async (item) => {
        const response = await fetchJson<Dnd2014SpellDetailResponse>(item.detailUrl, fetchImpl);
        return adaptDnd2014SpellToDraft(response);
      })
    );

    return toSuccess(spells);
  } catch (error) {
    return toFailure(
      'code' in (error as object) && 'message' in (error as object)
        ? (error as CardImportError)
        : createImportError('parse', 'Unable to import one or more selected spells.', error)
    );
  }
}

export const DND_2014_SPELLS_SOURCE_ID = 'dnd-2014-spells';

export const dnd2014SpellsSource: CardImportSource = {
  id: DND_2014_SPELLS_SOURCE_ID,
  label: 'D&D 2014 Spells',
  description: 'Import SRD spells from the D&D 5e API.',
  loadItems(fetchImpl = fetch) {
    return loadDnd2014SpellItems(fetchImpl);
  },
  importItems(items, fetchImpl = fetch) {
    return importDnd2014SpellItems(items, fetchImpl);
  }
};
