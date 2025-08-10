import DOMPurify from 'dompurify';
import { loadDefaultJapaneseParser } from 'budoux';

let parserPromise: ReturnType<typeof loadDefaultJapaneseParser> | undefined;
const getParser = () => {
  if (!parserPromise) {
    try {
      parserPromise = loadDefaultJapaneseParser();
    } catch (e) {
      // 次回以降の再試行のため、失敗時はキャッシュを解放
      parserPromise = undefined;
      throw e;
    }
  }
  return parserPromise;
};

export default {
  async mounted(el: HTMLElement) {
    const parser = await getParser();
    const text = el.textContent ?? '';
    const html = parser.translateHTMLString(text);
    el.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['wbr'] });
    el.style.setProperty('text-wrap', 'balance');
    el.style.setProperty('word-break', 'auto-phrase');
  },

  async updated(el: HTMLElement) {
    const parser = await getParser();
    const text = el.textContent ?? '';
    const html = parser.translateHTMLString(text);
    el.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['wbr'] });
    el.style.setProperty('text-wrap', 'balance');
    el.style.setProperty('word-break', 'auto-phrase');
  },
};
