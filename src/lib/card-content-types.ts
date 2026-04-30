import 'svelte';
import type CardContentTypeDescriptor from '$model/card-content-type';
import type Card from '$model/card';
import type { CardContent } from '$model/card';
import Dndspellblock from '$components/card/content-blocks/dndspellblock.svelte';
import Dndstats from '$components/card/content-blocks/dndstats.svelte';
import CardTitle from '$components/card/content-blocks/card-title.svelte';
import Text from '$components/card/content-blocks/text.svelte';
import Rule from '$components/card/content-blocks/rule.svelte';
import Section from '$components/card/content-blocks/section.svelte';
import Subtitle from '$components/card/content-blocks/subtitle.svelte';
import Property from '$components/card/content-blocks/property.svelte';
import Description from '$components/card/content-blocks/description.svelte';
import Boxes from '$components/card/content-blocks/boxes.svelte';
import Fill from '$components/card/content-blocks/fill.svelte';
import Bullet from '$components/card/content-blocks/bullet.svelte';
import Picture from '$components/card/content-blocks/picture.svelte';
import Footer from '$components/card/content-blocks/footer.svelte';
import Row from '$components/card/content-blocks/row.svelte';
import BoxesContentBlockEditor from '$components/card-editor/content-block-editors/boxes-content-block-editor.svelte';
import BulletContentBlockEditor from '$components/card-editor/content-block-editors/bullet-content-block-editor.svelte';
import CardtitleContentBlockEditor from '$components/card-editor/content-block-editors/cardtitle-content-block-editor.svelte';
import DescriptionContentBlockEditor from '$components/card-editor/content-block-editors/description-content-block-editor.svelte';
import DndspellblockContentBlockEditor from '$components/card-editor/content-block-editors/dndspellblock-content-block-editor.svelte';
import DndstatsContentBlockEditor from '$components/card-editor/content-block-editors/dndstats-content-block-editor.svelte';
import FillContentBlockEditor from '$components/card-editor/content-block-editors/fill-content-block-editor.svelte';
import FooterContentBlockEditor from '$components/card-editor/content-block-editors/footer-content-block-editor.svelte';
import PictureContentBlockEditor from '$components/card-editor/content-block-editors/picture-content-block-editor.svelte';
import PropertyContentBlockEditor from '$components/card-editor/content-block-editors/property-content-block-editor.svelte';
import RowContentBlockEditor from '$components/card-editor/content-block-editors/row-content-block-editor.svelte';
import RuleContentBlockEditor from '$components/card-editor/content-block-editors/rule-content-block-editor.svelte';
import SectionContentBlockEditor from '$components/card-editor/content-block-editors/section-content-block-editor.svelte';
import SubtitleContentBlockEditor from '$components/card-editor/content-block-editors/subtitle-content-block-editor.svelte';
import TextContentBlockEditor from '$components/card-editor/content-block-editors/text-content-block-editor.svelte';

const createCardContentTypes = <
  T extends readonly CardContentTypeDescriptor[] & Array<{ name: V }>,
  V extends string
>(
  ...args: T
) => args;

export const CARD_CONTENT_TYPES = createCardContentTypes(
  {
    name: 'cardtitle',
    label: 'Card Title',
    description: 'Displays the card title using the card header style.',
    params: [],
    renderComponent: CardTitle,
    editorComponent: CardtitleContentBlockEditor
  },
  {
    name: 'subtitle',
    label: 'Subtitle',
    description: 'Sligtly larger italics text',
    params: [
      { name: 'Subtitle', description: 'Subtitle text' },
      { name: 'Right-aligned', description: 'Additional right-aligned text', optional: true }
    ],
    renderComponent: Subtitle,
    editorComponent: SubtitleContentBlockEditor
  },
  {
    name: 'text',
    label: 'Text',
    description: 'Simple paragraph',
    params: [{ name: 'Text', description: 'Text', type: 'textarea' }],
    verticalSpacing: 2,
    renderComponent: Text,
    editorComponent: TextContentBlockEditor
  },
  {
    name: 'rule',
    label: 'Divider',
    description: 'A horizontal line taking up full width',
    params: [],
    renderComponent: Rule,
    editorComponent: RuleContentBlockEditor
  },
  {
    name: 'property',
    label: 'Property',
    description:
      'A property with a bold name and normal description - if spanning more than one line, description is indented.',
    params: [
      { name: 'Name', description: 'Property name (bolded)' },
      { name: 'Description', description: 'Property description' }
    ],
    renderComponent: Property,
    editorComponent: PropertyContentBlockEditor
  },
  {
    name: 'description',
    label: 'Description',
    description: 'Same as `property` but with no indentation and name is italicized.',
    params: [
      { name: 'Name', description: 'Description name (bolded, italicized)' },
      { name: 'Description', description: 'Description description' }
    ],
    renderComponent: Description,
    editorComponent: DescriptionContentBlockEditor
  },
  {
    name: 'row',
    label: 'Row',
    description: 'A horizontal row with evenly sized columns that can contain nested content.',
    params: [],
    renderComponent: Row,
    editorComponent: RowContentBlockEditor
  },
  {
    name: 'section',
    label: 'Section',
    description: 'Section header',
    params: [
      { name: 'Section name', description: 'Section name' },
      { name: 'Right-aligned', description: 'Additional right-aligned text', optional: true }
    ],
    renderComponent: Section,
    editorComponent: SectionContentBlockEditor
  },
  {
    name: 'boxes',
    label: 'Boxes',
    description: 'Empty boxes',
    params: [
      { name: 'Amount', description: 'Amount of boxes', type: 'number' },
      { name: 'Size', description: 'Size of the boxes', optional: true }
    ],
    renderComponent: Boxes,
    editorComponent: BoxesContentBlockEditor
  },
  {
    name: 'fill',
    label: 'Spacing',
    description: 'Empty area taking up available space',
    params: [{ name: 'Height', description: 'Height in mm', type: 'number', optional: true }],
    renderComponent: Fill,
    editorComponent: FillContentBlockEditor
  },
  {
    name: 'bullet',
    label: 'Bullet',
    description: 'Bulleted text',
    params: [{ name: 'Text', description: 'Text' }],
    renderComponent: Bullet,
    editorComponent: BulletContentBlockEditor
  },
  {
    name: 'picture',
    label: 'Picture',
    description: 'A picture from an url',
    params: [
      { name: 'URL', description: 'URL of the picture' },
      {
        name: 'Size',
        description: 'CSS height value such as 120px, 60%, auto, or 12rem',
        optional: true
      }
    ],
    renderComponent: Picture,
    editorComponent: PictureContentBlockEditor
  },
  {
    name: 'footer',
    label: 'Footer',
    description:
      'Transparent footer row with left and right aligned text at the bottom of the card.',
    params: [
      { name: 'Left text', description: 'Left-aligned footer text', optional: true },
      { name: 'Right text', description: 'Right-aligned footer text', optional: true }
    ],
    renderComponent: Footer,
    editorComponent: FooterContentBlockEditor
  },
  {
    name: 'dndstats',
    label: 'D&D Stats',
    description: 'A Dungeons & Dragons stat block',
    params: [
      { name: 'Str', description: 'Strength score', type: 'number' },
      { name: 'Dex', description: 'Dexterity score', type: 'number' },
      { name: 'Con', description: 'Constitution score', type: 'number' },
      { name: 'Int', description: 'Intelligence score', type: 'number' },
      { name: 'Wis', description: 'Wisdom score', type: 'number' },
      { name: 'Cha', description: 'Charisma score', type: 'number' }
    ],
    renderComponent: Dndstats,
    editorComponent: DndstatsContentBlockEditor
  },
  {
    name: 'dndspellblock',
    label: 'D&D Spellblock',
    description: 'A Dungeons & Dragons spell card block',
    params: [
      { name: 'Casting time', description: 'Casting time' },
      { name: 'Range', description: 'Range' },
      { name: 'Components', description: 'Components' },
      { name: 'Duration', description: 'Duration' }
    ],
    renderComponent: Dndspellblock,
    editorComponent: DndspellblockContentBlockEditor
  }
);

export type CardContentType = (typeof CARD_CONTENT_TYPES)[number]['name'];

const CARD_CONTENT_TYPE_DESCRIPTOR_MAP = new Map<CardContentType, CardContentTypeDescriptor>();

CARD_CONTENT_TYPES.forEach((descriptor) => {
  CARD_CONTENT_TYPE_DESCRIPTOR_MAP.set(descriptor.name, descriptor);
});

export function getContentTypeDescriptor(type: CardContentType): CardContentTypeDescriptor {
  return CARD_CONTENT_TYPE_DESCRIPTOR_MAP.get(type);
}

export function isCardContentType(x: string): x is CardContentType {
  return CARD_CONTENT_TYPES.some((t) => t.name === x);
}

export function getContentBlockDefaultVerticalSpacing(type: CardContentType): number {
  return getContentTypeDescriptor(type)?.verticalSpacing ?? 0;
}

export function resolveContentBlockRenderProps(content: CardContent, card: Card) {
  const props: Record<string, unknown> = { content };

  if (content.type === 'cardtitle') {
    props.title = card?.title;
  }

  if (content.type === 'row') {
    props.card = card;
  }

  return props;
}

export function resolveContentBlockEditorBinding(content: CardContent) {
  if (content.type === 'row') {
    return 'content' as const;
  }

  if (content.type === 'cardtitle' || content.type === 'rule') {
    return 'none' as const;
  }

  return 'splitContent' as const;
}

export function resolveContentBlockEditorProps(
  content: CardContent,
  typeDescriptor: CardContentTypeDescriptor,
  {
    depth,
    setCollapsed,
    setCollapsedVersion
  }: {
    depth: number;
    setCollapsed: boolean;
    setCollapsedVersion: number;
  }
) {
  const props: Record<string, unknown> = {};

  if (content.type === 'row') {
    props.depth = depth;
    props.setCollapsed = setCollapsed;
    props.setCollapsedVersion = setCollapsedVersion;
  }

  if (content.type === 'dndspellblock' || content.type === 'footer' || content.type === 'section') {
    props.typeDescriptor = typeDescriptor;
  }

  return props;
}
