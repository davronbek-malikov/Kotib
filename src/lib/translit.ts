/**
 * Uzbek Latin -> Cyrillic.
 *
 * plan.md §3.5 and §8: Latin and Cyrillic are one language in two scripts,
 * not two translations. Only the Latin dictionary is maintained; Cyrillic is
 * generated here, so the two can never drift apart. The test suite is the
 * guard.
 */

/** Words the letter rules get wrong. Checked whole-word, case-insensitively. */
const EXCEPTIONS: Record<string, string> = {
  tsex: 'цех',
  tsirk: 'цирк',
};

/** Longest-first: digraphs must win over their component letters. */
const PAIRS: [string, string][] = [
  ["o'", 'ў'], ['o‘', 'ў'], ['oʻ', 'ў'],
  ["g'", 'ғ'], ['g‘', 'ғ'], ['gʻ', 'ғ'],
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['ng', 'нг'],
  ['ya', 'я'], ['yo', 'ё'], ['yu', 'ю'], ['ye', 'е'],
  ['a', 'а'], ['b', 'б'], ['d', 'д'], ['e', 'е'], ['f', 'ф'],
  ['g', 'г'], ['h', 'ҳ'], ['i', 'и'], ['j', 'ж'], ['k', 'к'],
  ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'],
  ['q', 'қ'], ['r', 'р'], ['s', 'с'], ['t', 'т'], ['u', 'у'],
  ['v', 'в'], ['x', 'х'], ['y', 'й'], ['z', 'з'],
  ["'", 'ъ'], ['‘', 'ъ'], ['ʼ', 'ъ'],
];

function isUpper(ch: string): boolean {
  return ch !== ch.toLowerCase();
}

/** "ш" -> "Ш"; "нг" -> "Нг" (only the first letter is capitalized). */
function matchCase(out: string, upper: boolean): string {
  if (!upper) return out;
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function convertWord(word: string): string {
  const lower = word.toLowerCase();
  const exception = EXCEPTIONS[lower];
  if (exception) {
    return isUpper(word.charAt(0))
      ? exception.charAt(0).toUpperCase() + exception.slice(1)
      : exception;
  }

  let out = '';
  let i = 0;
  while (i < word.length) {
    // Word-initial 'e' is э, elsewhere it is е (yer -> ер, eslatma -> эслатма).
    if (i === 0 && lower.charAt(0) === 'e') {
      out += matchCase('э', isUpper(word.charAt(0)));
      i += 1;
      continue;
    }
    let matched = false;
    for (const [latin, cyr] of PAIRS) {
      if (lower.startsWith(latin, i)) {
        out += matchCase(cyr, isUpper(word.charAt(i)));
        i += latin.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += word.charAt(i);
      i += 1;
    }
  }
  return out;
}

export function toCyrillic(latin: string): string {
  // Split on word boundaries so EXCEPTIONS and the word-initial 'e' rule can be
  // applied per word while punctuation/spacing passes through untouched.
  return latin.replace(/[A-Za-z'‘ʻʼ]+/g, (word) => convertWord(word));
}
