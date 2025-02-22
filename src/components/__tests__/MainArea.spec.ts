import { describe, it, expect, beforeEach, vi } from 'vitest';

import { mount } from '@vue/test-utils';
import MainArea from '../MainArea.vue';

describe('MainArea', () => {
  it('renders properly', () => {
    const wrapper = mount(MainArea, { props: {} });
    expect(wrapper.text()).toContain('PDFを結合・ファイルサイズ縮小');
  });
});

describe('MainArea.vue - addFiles', () => {
  beforeEach(() => {
    global.URL.revokeObjectURL = vi.fn();

    // Mock crypto.randomUUID
    // @ts-expect-error: Mocking randomUUID
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => 'test-uuid');
  });

  it('should handle empty files array', async () => {
    const wrapper = mount(MainArea);
    // @ts-expect-error: accessing private method
    await wrapper.vm.addFiles([]);
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.pdfFiles).toHaveLength(0);
  });

  it('should add only PDF files to pdfFiles', async () => {
    const wrapper = mount(MainArea);
    const files = [
      new File([''], 'test.pdf', { type: 'application/pdf' }),
      new File([''], 'test.txt', { type: 'text/plain' }),
      new File([''], 'test2.pdf', { type: 'application/pdf' }),
    ];

    // @ts-expect-error: accessing private method
    await wrapper.vm.addFiles(files);

    // @ts-expect-error: accessing private ref
    const pdfFiles = wrapper.vm.pdfFiles;
    expect(pdfFiles).toHaveLength(2);
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
  });

  it('should reset compressed PDF when adding files', async () => {
    const wrapper = mount(MainArea);
    // @ts-expect-error: accessing private ref
    wrapper.vm.compressedPDF = 'blob:test';
    // @ts-expect-error: accessing private ref
    wrapper.vm.fileSize = 1000;

    const files = [new File([''], 'test.pdf', { type: 'application/pdf' })];

    // @ts-expect-error: accessing private method
    await wrapper.vm.addFiles(files);

    // @ts-expect-error: accessing private refs
    expect(wrapper.vm.compressedPDF).toBeNull();
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.fileSize).toBe(0);
  });
});
