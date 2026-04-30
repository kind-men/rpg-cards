import type {
  CardImportError,
  CardImportListItem,
  CardImportResult,
  CardImportSource,
  ImportedCardDraft
} from '$lib/card-import/types';

const DND_API_ORIGIN = 'https://www.dnd5eapi.co';
const DND_2014_EQUIPMENT_ENDPOINT = `${DND_API_ORIGIN}/api/2014/equipment/`;
const DND_2014_MAGIC_ITEMS_ENDPOINT = `${DND_API_ORIGIN}/api/2014/magic-items/`;

interface DndApiReference {
  index: string;
  name: string;
  url: string;
}

interface DndResourceListResponse {
  count?: number;
  results?: DndApiReference[];
}

interface DndEquipmentCost {
  quantity?: number;
  unit?: string;
}

interface DndEquipmentRange {
  normal?: number;
  long?: number;
}

interface DndEquipmentDamage {
  damage_dice?: string;
  damage_type?: {
    name?: string;
  };
}

interface DndEquipmentArmorClass {
  base?: number;
  dex_bonus?: boolean;
  max_bonus?: number | null;
}

interface DndEquipmentSpeed {
  quantity?: number;
  unit?: string;
}

interface DndEquipmentResponse {
  index: string;
  name: string;
  equipment_category?: DndApiReference;
  gear_category?: DndApiReference;
  tool_category?: string;
  vehicle_category?: string;
  weapon_category?: string;
  weapon_range?: string;
  category_range?: string;
  cost?: DndEquipmentCost;
  weight?: number;
  damage?: DndEquipmentDamage;
  range?: DndEquipmentRange;
  throw_range?: DndEquipmentRange;
  armor_category?: string;
  armor_class?: DndEquipmentArmorClass;
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  speed?: DndEquipmentSpeed;
  desc?: string[];
  properties?: DndApiReference[];
  contents?: Array<{
    item?: DndApiReference;
    quantity?: number;
  }>;
}

interface DndMagicItemResponse {
  index: string;
  name: string;
  desc?: string[];
  image?: string;
  equipment_category?: DndApiReference;
  rarity?: {
    name?: string;
  };
  variants?: DndApiReference[];
  variant?: boolean;
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

function resolveApiImageUrl(url: string): string {
  return new URL(url, DND_API_ORIGIN).toString();
}

async function fetchJson<T>(url: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw createImportError('network', `Request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export const DND_2014_ITEMS_SOURCE_ID = 'dnd-2014-items';

function parseResourceListItems(
  response: DndResourceListResponse,
  subtype: 'equipment' | 'magic-item'
): CardImportListItem[] {
  const results = Array.isArray(response?.results) ? response.results : [];
  const subtitle = subtype === 'magic-item' ? 'Magic item' : 'Equipment';

  return results
    .filter((item) => item?.index && item?.name && item?.url)
    .map((item) => ({
      id: `${subtype}:${item.index}`,
      title: item.name,
      subtitle,
      detailUrl: resolveApiUrl(item.url),
      searchText: `${item.name} ${item.index} ${subtitle}`.toLowerCase()
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function formatCost(cost?: DndEquipmentCost): string {
  if (!cost || cost.quantity == null || !cost.unit) {
    return '';
  }

  return `${cost.quantity} ${cost.unit}`;
}

function formatWeight(weight?: number): string {
  if (weight == null) {
    return '';
  }

  return `${weight} lb`;
}

function formatRange(range?: DndEquipmentRange): string {
  if (!range || range.normal == null) {
    return '';
  }

  return range.long != null ? `${range.normal}/${range.long} ft.` : `${range.normal} ft.`;
}

function formatArmorClass(armorClass?: DndEquipmentArmorClass): string {
  if (!armorClass?.base) {
    return '';
  }

  const parts = [`${armorClass.base}`];

  if (armorClass.dex_bonus) {
    parts.push('Dex modifier');
  }

  if (armorClass.max_bonus != null) {
    parts.push(`max ${armorClass.max_bonus}`);
  }

  return parts.join(' + ');
}

function formatDamage(damage?: DndEquipmentDamage): string {
  if (!damage?.damage_dice) {
    return '';
  }

  return [damage.damage_dice, damage.damage_type?.name].filter(Boolean).join(' ');
}

function formatProperties(properties?: DndApiReference[]): string {
  return (properties ?? [])
    .map((property) => property?.name?.trim())
    .filter(Boolean)
    .join(', ');
}

function formatContents(
  contents?: Array<{
    item?: DndApiReference;
    quantity?: number;
  }>
): string {
  return (contents ?? [])
    .map((entry) => {
      const itemName = entry.item?.name?.trim();

      if (!itemName) {
        return '';
      }

      if (entry.quantity == null) {
        return itemName;
      }

      return `${entry.quantity}x ${itemName}`;
    })
    .filter(Boolean)
    .join(', ');
}

function buildEquipmentFooterRight(item: DndEquipmentResponse): string {
  return (
    item.equipment_category?.name ??
    item.weapon_range ??
    item.armor_category ??
    item.tool_category ??
    item.vehicle_category ??
    'Equipment'
  );
}

export function adaptDnd2014EquipmentToDraft(item: DndEquipmentResponse): ImportedCardDraft {
  if (!item?.index || !item?.name) {
    throw createImportError('parse', 'Equipment response is missing required fields.');
  }

  const tags = ['imported', 'dnd-2014', 'item', 'equipment', `source:${DND_2014_ITEMS_SOURCE_ID}`];

  if (item.equipment_category?.index) {
    tags.push(`category:${item.equipment_category.index}`);
  }

  const blocks: ImportedCardDraft['blocks'] = [
    {
      type: 'rule'
    }
  ];

  const properties = [
    ['Cost', formatCost(item.cost)],
    ['Weight', formatWeight(item.weight)],
    ['Damage', formatDamage(item.damage)],
    ['Range', formatRange(item.range)],
    ['Thrown range', formatRange(item.throw_range)],
    ['Armor Class', formatArmorClass(item.armor_class)],
    ['Strength', item.str_minimum != null ? String(item.str_minimum) : ''],
    [
      'Stealth',
      item.stealth_disadvantage == null ? '' : item.stealth_disadvantage ? 'Disadvantage' : 'Normal'
    ],
    ['Properties', formatProperties(item.properties)],
    [
      'Speed',
      item.speed?.quantity != null && item.speed?.unit
        ? `${item.speed.quantity} ${item.speed.unit}`
        : ''
    ],
    ['Contents', formatContents(item.contents)]
  ].filter(([, value]) => Boolean(value));

  blocks.push(
    ...properties.map(([label, value]) => ({
      type: 'property' as const,
      content: `${label} | ${value}`
    }))
  );

  if (properties.length > 0) {
    blocks.push({
      type: 'rule'
    });
  }

  blocks.push(
    ...((item.desc ?? []).length > 0
      ? (item.desc ?? []).map((paragraph) => ({
          type: 'text' as const,
          content: paragraph
        }))
      : [
          {
            type: 'text' as const,
            content: 'Describe the item here.'
          }
        ])
  );

  blocks.push({
    type: 'footer',
    content: `${item.gear_category?.name ?? item.weapon_category ?? item.armor_category ?? item.tool_category ?? item.vehicle_category ?? ''} | ${buildEquipmentFooterRight(item)}`
  });

  return {
    sourceId: DND_2014_ITEMS_SOURCE_ID,
    externalId: item.index,
    title: item.name,
    tags,
    template: 'item',
    blocks,
    layout: {
      show_title: true
    }
  };
}

function buildMagicItemFooterLeft(item: DndMagicItemResponse): string {
  return item.equipment_category?.name ?? 'Magic item';
}

function buildMagicItemFooterRight(item: DndMagicItemResponse): string {
  const parts = [item.rarity?.name];

  if (item.variant) {
    parts.push('Variant');
  }

  return parts.filter(Boolean).join(' ');
}

export function adaptDnd2014MagicItemToDraft(item: DndMagicItemResponse): ImportedCardDraft {
  if (!item?.index || !item?.name) {
    throw createImportError('parse', 'Magic item response is missing required fields.');
  }

  const tags = ['imported', 'dnd-2014', 'item', 'magic-item', `source:${DND_2014_ITEMS_SOURCE_ID}`];

  if (item.equipment_category?.index) {
    tags.push(`category:${item.equipment_category.index}`);
  }

  if (item.rarity?.name) {
    tags.push(`rarity:${item.rarity.name.toLowerCase().replace(/\s+/g, '-')}`);
  }

  const blocks: ImportedCardDraft['blocks'] = [
    {
      type: 'rule'
    }
  ];

  if (item.rarity?.name) {
    blocks.push({
      type: 'property',
      content: `Rarity | ${item.rarity.name}`
    });
  }

  if (Array.isArray(item.variants) && item.variants.length > 0) {
    blocks.push({
      type: 'property',
      content: `Variants | ${item.variants.map((variant) => variant.name).join(', ')}`
    });
  }

  if (blocks[blocks.length - 1]?.type === 'property') {
    blocks.push({
      type: 'rule'
    });
  }

  blocks.push(
    ...((item.desc ?? []).length > 0
      ? (item.desc ?? []).map((paragraph) => ({
          type: 'text' as const,
          content: paragraph
        }))
      : [
          {
            type: 'text' as const,
            content: 'Describe the item here.'
          }
        ])
  );

  blocks.push({
    type: 'footer',
    content: `${buildMagicItemFooterLeft(item)} | ${buildMagicItemFooterRight(item)}`
  });

  return {
    sourceId: DND_2014_ITEMS_SOURCE_ID,
    externalId: item.index,
    title: item.name,
    tags,
    template: 'item',
    blocks,
    layout: {
      show_title: true
    },
    cardbackMode: item.image ? 'images' : undefined,
    cardbackImages: item.image
      ? [
          {
            src: resolveApiImageUrl(item.image),
            size: 'cover'
          }
        ]
      : undefined,
    cardbackBackgroundColor: item.image ? '#ffffff' : undefined,
    cardbackBorderStyle: item.image ? 'none' : undefined
  };
}

async function loadDnd2014ItemItems(
  fetchImpl: typeof fetch
): Promise<CardImportResult<CardImportListItem[]>> {
  try {
    const [equipmentResponse, magicItemResponse] = await Promise.all([
      fetchJson<DndResourceListResponse>(DND_2014_EQUIPMENT_ENDPOINT, fetchImpl),
      fetchJson<DndResourceListResponse>(DND_2014_MAGIC_ITEMS_ENDPOINT, fetchImpl)
    ]);

    const items = [
      ...parseResourceListItems(equipmentResponse, 'equipment'),
      ...parseResourceListItems(magicItemResponse, 'magic-item')
    ].sort((left, right) => left.title.localeCompare(right.title));

    if (items.length === 0) {
      return toFailure(createImportError('empty', 'No items were returned by the source.'));
    }

    return toSuccess(items);
  } catch (error) {
    return toFailure(
      'code' in (error as object) && 'message' in (error as object)
        ? (error as CardImportError)
        : createImportError('network', 'Unable to load items from the source.', error)
    );
  }
}

async function importDnd2014ItemItems(
  items: CardImportListItem[],
  fetchImpl: typeof fetch
): Promise<CardImportResult<ImportedCardDraft[]>> {
  if (items.length === 0) {
    return toFailure(createImportError('empty', 'Select at least one item to import.'));
  }

  try {
    const drafts = await Promise.all(
      items.map(async (item) => {
        if (item.id.startsWith('magic-item:')) {
          const response = await fetchJson<DndMagicItemResponse>(item.detailUrl, fetchImpl);
          return adaptDnd2014MagicItemToDraft(response);
        }

        const response = await fetchJson<DndEquipmentResponse>(item.detailUrl, fetchImpl);
        return adaptDnd2014EquipmentToDraft(response);
      })
    );

    return toSuccess(drafts);
  } catch (error) {
    return toFailure(
      'code' in (error as object) && 'message' in (error as object)
        ? (error as CardImportError)
        : createImportError('parse', 'Unable to import one or more selected items.', error)
    );
  }
}

export const dnd2014ItemsSource: CardImportSource = {
  id: DND_2014_ITEMS_SOURCE_ID,
  label: 'D&D 2014 Items',
  description: 'Import both equipment and magic items from the D&D 5e API.',
  loadItems(fetchImpl = fetch) {
    return loadDnd2014ItemItems(fetchImpl);
  },
  importItems(items, fetchImpl = fetch) {
    return importDnd2014ItemItems(items, fetchImpl);
  }
};
