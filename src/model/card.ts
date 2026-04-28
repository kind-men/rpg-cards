import type { CardContentTypeV2 } from '$lib/card-content-types';
import type ColorResolvable from './color-resolvable';

export type CardBackMode = 'icon' | 'images';
export type CardBackImageSizePreset = 'cover' | 'contain' | 'custom';
export type CardBackBorderStyle = 'none' | 'normal';

export interface CardBackImage {
  src: string;
  size?: string;
}

export interface BaseCardContent {
  id?: string;
}

export interface FlatCardContent extends BaseCardContent {
  type: Exclude<CardContentTypeV2, 'row'>;
  content: string;
}

export interface RowCardContent extends BaseCardContent {
  type: 'row';
  columns: CardContent[][];
}

export type CardContent = FlatCardContent | RowCardContent;

export default interface Card {
  count: number;
  color: ColorResolvable;
  title: string;
  icon: string;
  icon_back: string;
  text_back?: string;
  cardback_mode?: CardBackMode;
  cardback_images?: CardBackImage[];
  cardback_background_color?: ColorResolvable;
  cardback_border_style?: CardBackBorderStyle;
  contents: CardContent[];
  tags: string[];
  layout: CardLayout;
}

export interface CardLayout {
  show_title?: boolean;
  base_font_size?: string;
  text_font_size?: string;
  title_font_size?: string;
  custom_css?: string;
}
