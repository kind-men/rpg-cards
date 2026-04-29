export type CardFormat = 'poker' | 'bridge' | 'tarot' | 'square-1' | 'square-2' | 'custom';

export type PaperFormat = 'a3' | 'a4' | 'a5' | 'letter' | 'legal' | 'custom';

export default interface PageLayout {
  paperFormat: PaperFormat;
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
