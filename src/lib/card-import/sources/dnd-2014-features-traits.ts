import type {
  CardImportError,
  CardImportListItem,
  CardImportResult,
  CardImportSource,
  ImportedCardDraft
} from '$lib/card-import/types';

const DND_API_ORIGIN = 'https://www.dnd5eapi.co';
const DND_GRAPHQL_ENDPOINT = `${DND_API_ORIGIN}/graphql`;

const FEATURE_TRAIT_LIST_QUERY = `
  query Dnd2014FeatureTraitList {
    features {
      index
      name
      level
      class {
        index
        name
      }
      subclass {
        index
        name
      }
    }
    traits {
      index
      name
      races {
        index
        name
      }
      subraces {
        index
        name
      }
    }
  }
`;

interface DndApiReference {
  index: string;
  name: string;
  url: string;
}

interface DndGraphqlReference {
  index: string;
  name: string;
}

interface DndResourceListResponse {
  count?: number;
  results?: DndApiReference[];
}

interface DndGraphqlError {
  message?: string;
}

interface DndGraphqlResponse<T> {
  data?: T;
  errors?: DndGraphqlError[];
}

interface Dnd2014FeatureListEntry extends DndGraphqlReference {
  level?: number;
  class?: DndGraphqlReference;
  subclass?: DndGraphqlReference;
}

interface Dnd2014TraitListEntry extends DndGraphqlReference {
  races?: DndGraphqlReference[];
  subraces?: DndGraphqlReference[];
}

interface Dnd2014FeatureTraitListResponse {
  features?: Dnd2014FeatureListEntry[];
  traits?: Dnd2014TraitListEntry[];
}

interface DndChoice {
  desc?: string;
  choose?: number;
  type?: string;
}

interface Dnd2014FeatureResponse {
  index: string;
  name: string;
  desc?: string[];
  level?: number;
  class?: DndApiReference;
  subclass?: DndApiReference;
  parent?: DndApiReference;
  prerequisites?: unknown[];
}

interface Dnd2014TraitResponse {
  index: string;
  name: string;
  desc?: string[];
  races?: DndApiReference[];
  subraces?: DndApiReference[];
  proficiencies?: DndApiReference[];
  proficiency_choices?: DndChoice;
  language_options?: DndChoice;
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

async function fetchGraphql<T>(query: string, fetchImpl: typeof fetch): Promise<T> {
  const response = await fetchImpl(DND_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw createImportError('network', `GraphQL request failed with status ${response.status}.`);
  }

  const result = (await response.json()) as DndGraphqlResponse<T>;

  if (Array.isArray(result.errors) && result.errors.length > 0) {
    throw createImportError(
      'parse',
      result.errors
        .map((error) => error.message)
        .filter(Boolean)
        .join(' ') || 'GraphQL returned an error.'
    );
  }

  if (!result.data) {
    throw createImportError('parse', 'GraphQL response is missing data.');
  }

  return result.data;
}

export const DND_2014_FEATURES_TRAITS_SOURCE_ID = 'dnd-2014-features-traits';

function getFeatureListSubtitle(feature: Dnd2014FeatureListEntry): string {
  const parts = ['Feature'];

  if (feature.class?.name && feature.level != null) {
    parts.push(`${feature.class.name} level ${feature.level}`);
  } else if (feature.class?.name) {
    parts.push(feature.class.name);
  } else if (feature.level != null) {
    parts.push(`Level ${feature.level}`);
  }

  if (feature.subclass?.name) {
    parts.push(feature.subclass.name);
  }

  return parts.join(' | ');
}

function getTraitListSubtitle(trait: Dnd2014TraitListEntry): string {
  const raceText = formatReferences(trait.races);
  const subraceText = formatReferences(trait.subraces);

  return ['Trait', raceText, subraceText].filter(Boolean).join(' | ');
}

function toDetailUrl(subtype: 'features' | 'traits', index: string): string {
  return resolveApiUrl(`/api/2014/${subtype}/${index}`);
}

export function parseDnd2014FeatureTraitListItems(
  featureResponse: DndResourceListResponse,
  traitResponse: DndResourceListResponse
): CardImportListItem[] {
  return parseDnd2014FeatureTraitGraphqlItems({
    features: featureResponse.results,
    traits: traitResponse.results
  });
}

export function parseDnd2014FeatureTraitGraphqlItems(
  response: Dnd2014FeatureTraitListResponse
): CardImportListItem[] {
  const features = Array.isArray(response?.features) ? response.features : [];
  const traits = Array.isArray(response?.traits) ? response.traits : [];

  return [
    ...features
      .filter((feature) => feature?.index && feature?.name)
      .map((feature) => {
        const subtitle = getFeatureListSubtitle(feature);

        return {
          id: `feature:${feature.index}`,
          title: feature.name,
          subtitle,
          detailUrl: toDetailUrl('features', feature.index),
          searchText: [
            feature.name,
            feature.index,
            subtitle,
            feature.class?.index,
            feature.class?.name,
            feature.subclass?.index,
            feature.subclass?.name,
            feature.level != null ? `level ${feature.level}` : ''
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        };
      }),
    ...traits
      .filter((trait) => trait?.index && trait?.name)
      .map((trait) => {
        const subtitle = getTraitListSubtitle(trait);

        return {
          id: `trait:${trait.index}`,
          title: trait.name,
          subtitle,
          detailUrl: toDetailUrl('traits', trait.index),
          searchText: [
            trait.name,
            trait.index,
            subtitle,
            ...(trait.races ?? []).flatMap((race) => [race?.index, race?.name]),
            ...(trait.subraces ?? []).flatMap((subrace) => [subrace?.index, subrace?.name])
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        };
      })
  ].sort((left, right) => left.title.localeCompare(right.title));
}

function formatReference(reference?: DndApiReference | DndGraphqlReference): string {
  return reference?.name?.trim() ?? '';
}

function formatReferences(references?: Array<DndApiReference | DndGraphqlReference>): string {
  return (references ?? []).map(formatReference).filter(Boolean).join(', ');
}

function formatChoice(choice?: DndChoice): string {
  if (!choice) {
    return '';
  }

  if (choice.desc?.trim()) {
    return choice.desc.trim();
  }

  if (choice.choose != null && choice.type?.trim()) {
    return `Choose ${choice.choose} ${choice.type.trim()}`;
  }

  return '';
}

function formatPrerequisite(prerequisite: unknown): string {
  if (!prerequisite || typeof prerequisite !== 'object') {
    return '';
  }

  if ('name' in prerequisite && typeof prerequisite.name === 'string') {
    return prerequisite.name;
  }

  if ('feature' in prerequisite) {
    return formatReference(prerequisite.feature as DndApiReference);
  }

  if ('level' in prerequisite && typeof prerequisite.level === 'number') {
    return `Level ${prerequisite.level}`;
  }

  return '';
}

function formatPrerequisites(prerequisites?: unknown[]): string {
  return (prerequisites ?? []).map(formatPrerequisite).filter(Boolean).join(', ');
}

function addRuleAfterProperties(blocks: ImportedCardDraft['blocks']): void {
  if (blocks[blocks.length - 1]?.type === 'property') {
    blocks.push({
      type: 'rule'
    });
  }
}

function appendDescriptionBlocks(blocks: ImportedCardDraft['blocks'], desc?: string[]): void {
  blocks.push(
    ...((desc ?? []).length > 0
      ? (desc ?? []).map((paragraph) => ({
          type: 'text' as const,
          content: paragraph
        }))
      : [
          {
            type: 'text' as const,
            content: 'Describe this ability here.'
          }
        ])
  );
}

function buildFeatureFooterLeft(feature: Dnd2014FeatureResponse): string {
  return [feature.class?.name, feature.subclass?.name].filter(Boolean).join(', ');
}

function buildFeatureFooterRight(feature: Dnd2014FeatureResponse): string {
  return feature.level != null ? `Level ${feature.level} Feature` : 'Feature';
}

export function adaptDnd2014FeatureToDraft(feature: Dnd2014FeatureResponse): ImportedCardDraft {
  if (!feature?.index || !feature?.name) {
    throw createImportError('parse', 'Feature response is missing required fields.');
  }

  const tags = ['imported', 'dnd-2014', 'feature', `source:${DND_2014_FEATURES_TRAITS_SOURCE_ID}`];

  if (feature.class?.index) {
    tags.push(`class:${feature.class.index}`);
  }

  if (feature.subclass?.index) {
    tags.push(`subclass:${feature.subclass.index}`);
  }

  if (feature.level != null) {
    tags.push(`level:${feature.level}`);
  }

  const properties = [
    ['Class', formatReference(feature.class)],
    ['Subclass', formatReference(feature.subclass)],
    ['Level', feature.level != null ? String(feature.level) : ''],
    ['Parent', formatReference(feature.parent)],
    ['Prerequisites', formatPrerequisites(feature.prerequisites)]
  ].filter(([, value]) => Boolean(value));

  const blocks: ImportedCardDraft['blocks'] = [
    {
      type: 'rule'
    },
    ...properties.map(([label, value]) => ({
      type: 'property' as const,
      content: `${label} | ${value}`
    }))
  ];

  addRuleAfterProperties(blocks);
  appendDescriptionBlocks(blocks, feature.desc);

  blocks.push({
    type: 'footer',
    content: `${buildFeatureFooterLeft(feature)} | ${buildFeatureFooterRight(feature)}`
  });

  return {
    sourceId: DND_2014_FEATURES_TRAITS_SOURCE_ID,
    externalId: feature.index,
    title: feature.name,
    tags,
    template: 'ability',
    blocks,
    layout: {
      show_title: true
    }
  };
}

function buildTraitFooterLeft(trait: Dnd2014TraitResponse): string {
  return [formatReferences(trait.races), formatReferences(trait.subraces)]
    .filter(Boolean)
    .join(', ');
}

export function adaptDnd2014TraitToDraft(trait: Dnd2014TraitResponse): ImportedCardDraft {
  if (!trait?.index || !trait?.name) {
    throw createImportError('parse', 'Trait response is missing required fields.');
  }

  const tags = ['imported', 'dnd-2014', 'trait', `source:${DND_2014_FEATURES_TRAITS_SOURCE_ID}`];

  for (const race of trait.races ?? []) {
    if (race?.index) {
      tags.push(`race:${race.index}`);
    }
  }

  for (const subrace of trait.subraces ?? []) {
    if (subrace?.index) {
      tags.push(`subrace:${subrace.index}`);
    }
  }

  const properties = [
    ['Races', formatReferences(trait.races)],
    ['Subraces', formatReferences(trait.subraces)],
    ['Proficiencies', formatReferences(trait.proficiencies)],
    ['Proficiency choice', formatChoice(trait.proficiency_choices)],
    ['Language choice', formatChoice(trait.language_options)]
  ].filter(([, value]) => Boolean(value));

  const blocks: ImportedCardDraft['blocks'] = [
    {
      type: 'rule'
    },
    ...properties.map(([label, value]) => ({
      type: 'property' as const,
      content: `${label} | ${value}`
    }))
  ];

  addRuleAfterProperties(blocks);
  appendDescriptionBlocks(blocks, trait.desc);

  blocks.push({
    type: 'footer',
    content: `${buildTraitFooterLeft(trait) || 'Trait'} | Racial Trait`
  });

  return {
    sourceId: DND_2014_FEATURES_TRAITS_SOURCE_ID,
    externalId: trait.index,
    title: trait.name,
    tags,
    template: 'ability',
    blocks,
    layout: {
      show_title: true
    }
  };
}

async function loadDnd2014FeatureTraitItems(
  fetchImpl: typeof fetch
): Promise<CardImportResult<CardImportListItem[]>> {
  try {
    const response = await fetchGraphql<Dnd2014FeatureTraitListResponse>(
      FEATURE_TRAIT_LIST_QUERY,
      fetchImpl
    );
    const items = parseDnd2014FeatureTraitGraphqlItems(response);

    if (items.length === 0) {
      return toFailure(
        createImportError('empty', 'No features or traits were returned by the source.')
      );
    }

    return toSuccess(items);
  } catch (error) {
    return toFailure(
      'code' in (error as object) && 'message' in (error as object)
        ? (error as CardImportError)
        : createImportError('network', 'Unable to load features and traits from the source.', error)
    );
  }
}

async function importDnd2014FeatureTraitItems(
  items: CardImportListItem[],
  fetchImpl: typeof fetch
): Promise<CardImportResult<ImportedCardDraft[]>> {
  if (items.length === 0) {
    return toFailure(createImportError('empty', 'Select at least one feature or trait to import.'));
  }

  try {
    const drafts = await Promise.all(
      items.map(async (item) => {
        if (item.id.startsWith('trait:')) {
          const response = await fetchJson<Dnd2014TraitResponse>(item.detailUrl, fetchImpl);
          return adaptDnd2014TraitToDraft(response);
        }

        const response = await fetchJson<Dnd2014FeatureResponse>(item.detailUrl, fetchImpl);
        return adaptDnd2014FeatureToDraft(response);
      })
    );

    return toSuccess(drafts);
  } catch (error) {
    return toFailure(
      'code' in (error as object) && 'message' in (error as object)
        ? (error as CardImportError)
        : createImportError('parse', 'Unable to import one or more selected abilities.', error)
    );
  }
}

export const dnd2014FeaturesTraitsSource: CardImportSource = {
  id: DND_2014_FEATURES_TRAITS_SOURCE_ID,
  label: 'D&D 2014 Features & Traits',
  description: 'Import class features and racial traits from the D&D 5e API.',
  loadItems(fetchImpl = fetch) {
    return loadDnd2014FeatureTraitItems(fetchImpl);
  },
  importItems(items, fetchImpl = fetch) {
    return importDnd2014FeatureTraitItems(items, fetchImpl);
  }
};
