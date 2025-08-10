// src/directives/budoux.ts
import { loadDefaultJapaneseParser } from 'budoux';

let parserPromise: ReturnType<typeof loadDefaultJapaneseParser> | undefined;
const getParser = () => {
  if (!parserPromise) parserPromise = loadDefaultJapaneseParser();
  return parserPromise;
}

export default {
  mounted(el: HTMLElement) {
    const parser = getParser();
    el.innerHTML = parser.translateHTMLString(el.textContent || '');
    el.style.textWrap = 'balance';
    el.style.wordBreak = 'auto-phrase';
  }
};
