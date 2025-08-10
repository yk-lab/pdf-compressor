import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';

// Create mock functions
const mockTranslateHTMLString = vi.fn();
const mockLoadDefaultJapaneseParser = vi.fn();
const mockSanitize = vi.fn();

// Mock budoux module
vi.mock('budoux', () => ({
  loadDefaultJapaneseParser: mockLoadDefaultJapaneseParser,
}));

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: mockSanitize,
  },
}));

interface MockParser {
  translateHTMLString: ReturnType<typeof vi.fn>;
}

interface BudouxDirective {
  mounted: (el: HTMLElement) => Promise<void>;
  updated: (el: HTMLElement) => Promise<void>;
}

describe('budoux directive', () => {
  let mockParser: MockParser;
  let budouxDirective: BudouxDirective;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset modules to clear cached parser instance and re-import directive
    // This ensures each test starts with a fresh state
    vi.resetModules();

    // Setup default mock behaviors
    mockParser = {
      translateHTMLString: mockTranslateHTMLString,
    };

    mockTranslateHTMLString.mockImplementation((text: string) => `${text}<wbr>`);
    mockLoadDefaultJapaneseParser.mockResolvedValue(mockParser);
    mockSanitize.mockImplementation((html: string) => html);

    // Import directive after mocks are set
    budouxDirective = (await import('./budoux')).default;

    // Mock CSS.supports
    global.CSS = {
      supports: vi.fn((prop: string) => {
        return prop === 'text-wrap: balance' || prop === 'word-break: auto-phrase';
      }),
    } as unknown as typeof CSS;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mounted hook', () => {
    it('should process text with Budoux and apply styles', async () => {
      const el = document.createElement('div');
      el.textContent = 'これはテストテキストです';

      await budouxDirective.mounted(el);

      expect(mockLoadDefaultJapaneseParser).toHaveBeenCalled();
      expect(mockTranslateHTMLString).toHaveBeenCalledWith('これはテストテキストです');
      expect(mockSanitize).toHaveBeenCalledWith('これはテストテキストです<wbr>', {
        ALLOWED_TAGS: ['wbr'],
        ALLOWED_ATTR: [],
      });
      expect(el.innerHTML).toBe('これはテストテキストです<wbr>');
      expect(el.style.getPropertyValue('text-wrap')).toBe('balance');
      expect(el.style.getPropertyValue('word-break')).toBe('auto-phrase');
      expect(el.dataset.budouxText).toBe('これはテストテキストです');
    });

    it('should skip processing if text has not changed', async () => {
      const el = document.createElement('div');
      el.textContent = 'テスト';
      el.dataset.budouxText = 'テスト';

      await budouxDirective.mounted(el);

      expect(mockLoadDefaultJapaneseParser).not.toHaveBeenCalled();
      expect(mockTranslateHTMLString).not.toHaveBeenCalled();
    });

    it('should handle parser loading error gracefully', async () => {
      const el = document.createElement('div');
      el.textContent = 'エラーテスト';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockLoadDefaultJapaneseParser.mockRejectedValue(new Error('Parser load failed'));

      await budouxDirective.mounted(el);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error applying Budoux:', expect.any(Error));
      expect(el.textContent).toBe('エラーテスト');
      expect(el.dataset.budouxText).toBeUndefined();
    });

    it('should handle null parser gracefully', async () => {
      const el = document.createElement('div');
      el.textContent = 'Nullパーサーテスト';

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockLoadDefaultJapaneseParser.mockResolvedValue(null);

      await budouxDirective.mounted(el);

      expect(consoleWarnSpy).toHaveBeenCalledWith('BudouX parser is not available');
      expect(el.textContent).toBe('Nullパーサーテスト');
    });

    it('should skip CSS properties when not supported', async () => {
      const el = document.createElement('div');
      el.textContent = 'CSSテスト';

      global.CSS = {
        supports: vi.fn(() => false),
      } as unknown as typeof CSS;

      await budouxDirective.mounted(el);

      expect(el.style.getPropertyValue('text-wrap')).toBe('');
      expect(el.style.getPropertyValue('word-break')).toBe('');
    });

    it('should handle undefined CSS object', async () => {
      const el = document.createElement('div');
      el.textContent = 'CSS未定義テスト';

      global.CSS = undefined as unknown as typeof CSS;

      await budouxDirective.mounted(el);

      expect(el.style.getPropertyValue('text-wrap')).toBe('');
      expect(el.style.getPropertyValue('word-break')).toBe('');
    });
  });

  describe('updated hook', () => {
    it('should process updated text', async () => {
      const el = document.createElement('div');
      el.textContent = '更新されたテキスト';

      await budouxDirective.updated(el);

      expect(mockLoadDefaultJapaneseParser).toHaveBeenCalled();
      expect(mockTranslateHTMLString).toHaveBeenCalledWith('更新されたテキスト');
      expect(el.innerHTML).toBe('更新されたテキスト<wbr>');
      expect(el.dataset.budouxText).toBe('更新されたテキスト');
    });

    it('should skip if text has not changed on update', async () => {
      const el = document.createElement('div');
      el.textContent = '同じテキスト';
      el.dataset.budouxText = '同じテキスト';

      await budouxDirective.updated(el);

      expect(mockLoadDefaultJapaneseParser).not.toHaveBeenCalled();
      expect(mockTranslateHTMLString).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should retry loading parser after failure', async () => {
      const el1 = document.createElement('div');
      el1.textContent = '最初のテキスト';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // First call fails
      mockLoadDefaultJapaneseParser.mockRejectedValueOnce(new Error('First load failed'));
      await budouxDirective.mounted(el1);

      // Verify error was logged (implementation may log once or twice)
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(
        consoleErrorSpy.mock.calls.some(
          (call) => call[0]?.includes?.('Error') || call[0]?.includes?.('Failed'),
        ),
      ).toBe(true);

      // Re-import directive to get clean cached state
      vi.resetModules();
      budouxDirective = (await import('./budoux')).default;

      // Setup mocks again for second call
      mockLoadDefaultJapaneseParser.mockResolvedValueOnce(mockParser);

      const el2 = document.createElement('div');
      el2.textContent = '二番目のテキスト';

      await budouxDirective.mounted(el2);

      expect(el2.innerHTML).toBe('二番目のテキスト<wbr>');
      expect(mockLoadDefaultJapaneseParser).toHaveBeenCalledTimes(2);
    });

    it('should call parser loading function only once for concurrent mounted calls', async () => {
      const el1 = document.createElement('div');
      el1.textContent = '最初のテキスト';
      const el2 = document.createElement('div');
      el2.textContent = '二番目のテキスト';
      const el3 = document.createElement('div');
      el3.textContent = '三番目のテキスト';

      mockLoadDefaultJapaneseParser.mockResolvedValueOnce(mockParser);

      // Call mounted on multiple elements concurrently
      const promises = [
        budouxDirective.mounted(el1),
        budouxDirective.mounted(el2),
        budouxDirective.mounted(el3),
      ];

      await Promise.all(promises);

      // Verify parser loading was called only once due to Promise caching
      expect(mockLoadDefaultJapaneseParser).toHaveBeenCalledTimes(1);

      // Verify all elements were processed correctly
      expect(el1.innerHTML).toBe('最初のテキスト<wbr>');
      expect(el2.innerHTML).toBe('二番目のテキスト<wbr>');
      expect(el3.innerHTML).toBe('三番目のテキスト<wbr>');
    });

    it('should handle translateHTMLString errors', async () => {
      const el = document.createElement('div');
      el.textContent = '翻訳エラーテスト';

      mockTranslateHTMLString.mockImplementation(() => {
        throw new Error('Translation failed');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await budouxDirective.mounted(el);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error applying Budoux:', expect.any(Error));
      expect(el.textContent).toBe('翻訳エラーテスト');
    });
  });

  describe('Vue component integration', () => {
    it('should work with Vue component', async () => {
      const TestComponent = {
        template: '<div v-budoux>Vue統合テスト</div>',
        directives: {
          budoux: budouxDirective,
        },
      };

      const wrapper = mount(TestComponent);

      // Flush all pending promises to ensure async operations complete
      await wrapper.vm.$nextTick();
      await Promise.resolve();
      await Promise.resolve(); // Double flush for nested promises

      const el = wrapper.element as HTMLElement;
      expect(el.innerHTML).toBe('Vue統合テスト<wbr>');
      expect(el.dataset.budouxText).toBe('Vue統合テスト');
    });
  });
});
