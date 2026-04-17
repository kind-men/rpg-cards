export type CardFormat =
  | 'poker'
  | 'bridge'
  | 'tarot'
  | 'square-1'
  | 'square-2'
  | 'custom';

export default interface PageLayout {
  paperSize: {
    width: number;
    height: number;
  };
  cardFormat: CardFormat;
  cardSize: {
    width: number;
    height: number;
  };
  adjust: {
    x?: number;
    y?: number;
  };
  cardBackBorder: number;
}
