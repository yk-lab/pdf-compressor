import { describe, it, expect, vi } from 'vitest';
import { getGeneratedPDFOutputFileName } from './file';
import { ref } from 'vue';

describe('getGeneratedPDFOutputFileName', () => {
  it('should generate a filename with the current date and time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 1, 12, 0, 0));
    const result = getGeneratedPDFOutputFileName();
    expect(result).toBe('20230101_120000.pdf');
    vi.useRealTimers();
  });

  it('should generate a filename with the provided Date', () => {
    const datetime = new Date(2023, 0, 1, 13, 0, 0);
    const result = getGeneratedPDFOutputFileName(datetime);
    expect(result).toBe('20230101_130000.pdf');
  });

  it('should generate a filename with the provided Ref<Date>', () => {
    const datetime = ref(new Date(2023, 0, 1, 14, 0, 0));
    const result = getGeneratedPDFOutputFileName(datetime);
    expect(result).toBe('20230101_140000.pdf');
  });
});
