export interface PrintGridLayoutInput {
  paperSize: { width: number; height: number };
  cardSize: { width: number; height: number };
  gap: number;
  pagePadding: number;
  bleed: number;
}

export interface PrintGridLayout {
  bleed: number;
  bleedExcess: number;
  columns: number;
  rows: number;
  trackSize: { width: number; height: number };
}

const normalizeNonNegative = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

const calculateGridCount = (availableSpace: number, trackSize: number, gap: number) =>
  Math.max(1, Math.floor((availableSpace + gap) / (trackSize + gap)));

export function getBleedAwarePrintGrid({
  paperSize,
  cardSize,
  gap,
  pagePadding,
  bleed
}: PrintGridLayoutInput): PrintGridLayout {
  const normalizedGap = normalizeNonNegative(gap);
  const normalizedPadding = normalizeNonNegative(pagePadding);
  const normalizedBleed = normalizeNonNegative(bleed);
  const bleedExcess = Math.max(0, normalizedBleed * 2 - normalizedGap);
  const edgeBleedAllowance = Math.min(normalizedBleed, normalizedPadding);
  const trackSize = {
    width: normalizeNonNegative(cardSize.width) + bleedExcess,
    height: normalizeNonNegative(cardSize.height) + bleedExcess
  };
  const availableWidth =
    normalizeNonNegative(paperSize.width) - normalizedPadding * 2 + edgeBleedAllowance * 2;
  const availableHeight =
    normalizeNonNegative(paperSize.height) - normalizedPadding * 2 + edgeBleedAllowance * 2;

  return {
    bleed: normalizedBleed,
    bleedExcess,
    columns: calculateGridCount(availableWidth, trackSize.width, normalizedGap),
    rows: calculateGridCount(availableHeight, trackSize.height, normalizedGap),
    trackSize
  };
}
