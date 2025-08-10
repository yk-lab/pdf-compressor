import DOMPurify from 'dompurify';
import { loadDefaultJapaneseParser } from 'budoux';
import type { ObjectDirective } from 'vue';

let parserPromise: ReturnType<typeof loadDefaultJapaneseParser> | undefined;
const getParser = async () => {
  if (!parserPromise) {
    parserPromise = loadDefaultJapaneseParser();
  }
  return parserPromise;
};

// Shared helper function to apply Budoux processing
const applyBudoux = async (el: HTMLElement) => {
  const text = el.textContent ?? '';
  const lastProcessedText = el.dataset.budouxText;

  // Skip if text hasn't changed
  if (text === lastProcessedText) {
    return;
  }

  try {
    const parser = await getParser();
    if (!parser) {
      console.warn('BudouX parser is not available');
      return;
    }
    const html = parser.translateHTMLString(text);
    el.innerHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['wbr'],
      ALLOWED_ATTR: [], // Explicitly disallow all attributes
    });

    // Apply CSS with feature detection
    if (typeof CSS !== 'undefined' && CSS.supports?.('text-wrap: balance')) {
      el.style.setProperty('text-wrap', 'balance');
    }
    if (typeof CSS !== 'undefined' && CSS.supports?.('word-break: auto-phrase')) {
      el.style.setProperty('word-break', 'auto-phrase');
    }

    // Store the processed text to avoid reprocessing
    el.dataset.budouxText = text;
  } catch (error) {
    console.error('Error applying Budoux:', error);
    // Gracefully fallback to original text
    el.textContent = text;
  }
};

export default {
  async mounted(el: HTMLElement) {
    await applyBudoux(el);
  },

  async updated(el: HTMLElement) {
    await applyBudoux(el);
  },
} satisfies ObjectDirective<HTMLElement>;
