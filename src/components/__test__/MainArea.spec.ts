import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { mount } from '@vue/test-utils';
import MainArea from '@/components/MainArea.vue';

describe('MainArea', () => {
  it('renders properly', () => {
    const wrapper = mount(MainArea, { props: {} });
    expect(wrapper.text()).toContain('PDFを結合・ファイルサイズ縮小');
  });
});

describe('MainArea.vue - addFiles', () => {
  const mockUUID = 'test-uuid';

  beforeEach(() => {
    global.URL.revokeObjectURL = vi.fn();

    // Mock crypto.randomUUID
    // @ts-expect-error: Mocking randomUUID
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => mockUUID);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle empty files array', async () => {
    const wrapper = mount(MainArea);
    await wrapper.vm.addFiles([]);
    expect(wrapper.vm.pdfFiles).toHaveLength(0);
  });

  it('should add PDF and image files to pdfFiles', async () => {
    const wrapper = mount(MainArea);
    const files = [
      new File([''], 'test.pdf', { type: 'application/pdf' }),
      new File([''], 'test.txt', { type: 'text/plain' }),
      new File([''], 'test2.pdf', { type: 'application/pdf' }),
      new File([''], 'test.jpg', { type: 'image/jpeg' }),
      new File([''], 'test.png', { type: 'image/png' }),
    ];

    wrapper.vm.addFiles(files);

    const pdfFiles = wrapper.vm.pdfFiles;
    expect(pdfFiles).toHaveLength(4);
    expect(pdfFiles[0]).toEqual({
      id: 'test-uuid',
      file: expect.objectContaining({
        name: 'test.pdf',
        type: 'application/pdf',
      }),
    });
    expect(pdfFiles[1]).toEqual({
      id: 'test-uuid',
      file: expect.objectContaining({
        name: 'test2.pdf',
        type: 'application/pdf',
      }),
    });
    expect(pdfFiles[2]).toEqual({
      id: 'test-uuid',
      file: expect.objectContaining({
        name: 'test.jpg',
        type: 'image/jpeg',
      }),
    });
    expect(pdfFiles[3]).toEqual({
      id: 'test-uuid',
      file: expect.objectContaining({
        name: 'test.png',
        type: 'image/png',
      }),
    });
  });

  it('should reset compressed PDF when adding files', async () => {
    const wrapper = mount(MainArea);
    // @ts-expect-error: accessing private ref
    wrapper.vm.compressedPDF = 'blob:test';
    // @ts-expect-error: accessing private ref
    wrapper.vm.fileSize = 1000;

    const files = [new File([''], 'test.pdf', { type: 'application/pdf' })];

    wrapper.vm.addFiles(files);

    // @ts-expect-error: accessing private refs
    expect(wrapper.vm.compressedPDF).toBeNull();
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.fileSize).toBe(0);
  });
});
