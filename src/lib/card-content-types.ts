import 'svelte';
import type CardContentTypeDescriptor from '$model/card-content-type';
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
    renderComponent: CardTitle
  },
  {
    name: 'text',
    label: 'Text',
    description: 'Simple paragraph',
    params: [{ name: 'Text', description: 'Text', type: 'textarea' }],
    renderComponent: Text
  },
  {
    name: 'subtitle',
    label: 'Subtitle',
    description: 'Sligtly larger italics text',
    params: [
      { name: 'Subtitle', description: 'Subtitle text' },
      { name: 'Right-aligned', description: 'Additional right-aligned text', optional: true }
    ],
    renderComponent: Subtitle
  },
  {
    name: 'rule',
    label: 'Divider',
    description: 'A horizontal line taking up full width',
    params: [],
    renderComponent: Rule
  },
  {
    name: 'property',
    label: 'Property',
    description:
      'A property with a bold name and normal description - if spanning more than one line, description is indented.',
    params: [
      { name: 'Name', description: 'Propety name (bolded)' },
      { name: 'Description', description: 'Propety description' }
    ],
    renderComponent: Property
  },
  {
    name: 'description',
    label: 'Description',
    description: 'Same as `property` but with no indentation and name is italicized.',
    params: [
      { name: 'Name', description: 'Description name (bolded, italicized)' },
      { name: 'Description', description: 'Description description' }
    ],
    renderComponent: Description
  },
  {
    name: 'section',
    label: 'Section',
    description: 'Section header',
    params: [
      { name: 'Section name', description: 'Section name' },
      { name: 'Right-aligned', description: 'Additional right-aligned text', optional: true }
    ],
    renderComponent: Section
  },
  {
    name: 'boxes',
    label: 'Boxes',
    description: 'Empty boxes',
    params: [
      { name: 'Amount', description: 'Amount of boxes', type: 'number' },
      { name: 'Size', description: 'Size of the boxes', optional: true }
    ],
    renderComponent: Boxes
  },
  {
    name: 'fill',
    label: 'Fill',
    description: 'Empty area taking up available space',
    params: [{ name: 'Height', description: 'Height in mm', type: 'number', optional: true }],
    renderComponent: Fill
  },
  {
    name: 'bullet',
    label: 'Bullet',
    description: 'Bulleted text',
    params: [{ name: 'Text', description: 'Text' }],
    renderComponent: Bullet
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
    renderComponent: Picture
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
    renderComponent: Footer
  },
  {
    name: 'row',
    label: 'Row',
    description: 'A horizontal row with evenly sized columns that can contain nested content.',
    params: [],
    renderComponent: Row
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
    renderComponent: Dndstats
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
    renderComponent: Dndspellblock
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
