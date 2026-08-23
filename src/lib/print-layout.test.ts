import { describe, expect, it } from 'vitest';
import { getBleedAwarePrintGrid } from './print-layout';

const pokerA4 = (bleed: number) =>
  getBleedAwarePrintGrid({
    paperSize: { width: 210, height: 297 },
    cardSize: { width: 63.5, height: 88.9 },
    gap: 2,
    pagePadding: 5,
    bleed
  });

describe('bleed-aware print layout', () => {
  it('keeps poker card tracks and capacity unchanged through half the gap', () => {
    expect(pokerA4(0)).toMatchObject({
      bleedExcess: 0,
      columns: 3,
      rows: 3,
      trackSize: { width: 63.5, height: 88.9 }
    });
    expect(pokerA4(1)).toMatchObject({
      bleedExcess: 0,
      columns: 3,
      rows: 3,
      trackSize: { width: 63.5, height: 88.9 }
    });
  });

  it('adds only the bleed amount that cannot fit in the configured gap', () => {
    expect(pokerA4(2)).toMatchObject({
      bleedExcess: 2,
      columns: 3,
      trackSize: { width: 65.5, height: 90.9 }
    });
  });

  it('uses page padding as edge-bleed allowance before reducing capacity', () => {
    expect(pokerA4(2)).toMatchObject({ columns: 3, rows: 3 });
    expect(pokerA4(3)).toMatchObject({ columns: 2, rows: 3 });
  });

  it('normalizes invalid bleed values to zero', () => {
    expect(pokerA4(Number.NaN)).toMatchObject({ bleed: 0, bleedExcess: 0 });
    expect(pokerA4(-1)).toMatchObject({ bleed: 0, bleedExcess: 0 });
  });
});
