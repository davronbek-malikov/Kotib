import { describe, expect, it } from 'vitest';
import { toCyrillic } from '../translit';

describe('toCyrillic', () => {
  it('maps single letters', () => {
    expect(toCyrillic('salom')).toBe('салом');
    expect(toCyrillic('kitob')).toBe('китоб');
  });

  it('maps digraphs before single letters', () => {
    expect(toCyrillic('shanba')).toBe('шанба');
    expect(toCyrillic('chorshanba')).toBe('чоршанба');
    expect(toCyrillic('yakshanba')).toBe('якшанба');
    expect(toCyrillic('ong')).toBe('онг');
  });

  it("handles o' and g' with both apostrophe styles", () => {
    expect(toCyrillic("o'zbek")).toBe('ўзбек');
    expect(toCyrillic('o‘zbek')).toBe('ўзбек');
    expect(toCyrillic("g'alaba")).toBe('ғалаба');
    expect(toCyrillic('g‘alaba')).toBe('ғалаба');
  });

  it('maps ya/yo/yu/ye and word-initial e', () => {
    expect(toCyrillic('yangi')).toBe('янги');
    expect(toCyrillic('yoz')).toBe('ёз');
    expect(toCyrillic('yurak')).toBe('юрак');
    expect(toCyrillic('eslatma')).toBe('эслатма');
  });

  it('preserves case', () => {
    expect(toCyrillic('Bugun')).toBe('Бугун');
    expect(toCyrillic('Shanba')).toBe('Шанба');
    expect(toCyrillic("O'zbekcha")).toBe('Ўзбекча');
  });

  it('leaves digits, punctuation and spacing alone', () => {
    expect(toCyrillic('3 vazifa · 1 uchrashuv')).toBe('3 вазифа · 1 учрашув');
  });

  it('applies the exception dictionary', () => {
    // 'tsex' must not become 'тсех' via t+s.
    expect(toCyrillic('tsex')).toBe('цех');
  });
});
