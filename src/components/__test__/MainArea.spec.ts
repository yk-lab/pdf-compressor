import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { mount, flushPromises } from '@vue/test-utils';
import MainArea from '@/components/MainArea.vue';
import * as pdfUtils from '@/utils/pdf';
import * as fileUtils from '@/utils/file';

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
}));

// Mock worker URL
vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({
  default: 'mock-worker-url',
}));

// Mock the utils
vi.mock('@/utils/pdf', () => ({
  mergePdfFiles: vi.fn(),
  renderPdfToCanvases: vi.fn(),
  createCompressedPdfFromImages: vi.fn(),
}));

vi.mock('@/utils/file', () => ({
  getGeneratedPDFOutputFileName: vi.fn(),
}));

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
      new File([''], 'test2.pdf', { type: 'application/pdf' }),
      new File([''], 'test.jpg', { type: 'image/jpeg' }),
      new File([''], 'test.png', { type: 'image/png' }),
    ];

    await wrapper.vm.addFiles(files);

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

    await wrapper.vm.addFiles(files);

    // @ts-expect-error: accessing private refs
    expect(wrapper.vm.compressedPDF).toBeNull();
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.fileSize).toBe(0);
  });
});

describe('MainArea.vue - mergeAndCompressPDF', () => {
  let mockCreateObjectURL: typeof URL.createObjectURL;
  let mockRevokeObjectURL: typeof URL.revokeObjectURL;
  const mockObjectURL = 'blob:mock-url';

  beforeEach(() => {
    // Mock URL methods
    mockCreateObjectURL = vi.fn().mockReturnValue(mockObjectURL);
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock crypto.randomUUID
    // @ts-expect-error: Mocking randomUUID
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => 'test-uuid');

    // Setup default mock returns
    // Create a mock PDFDocumentProxy
    const mockPdfDocument = {
      numPages: 1,
      getPage: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof pdfUtils.mergePdfFiles>>;

    vi.mocked(pdfUtils.mergePdfFiles).mockResolvedValue(mockPdfDocument);
    vi.mocked(pdfUtils.renderPdfToCanvases).mockResolvedValue([document.createElement('canvas')]);
    vi.mocked(pdfUtils.createCompressedPdfFromImages).mockResolvedValue(new Uint8Array(1000));
    vi.mocked(fileUtils.getGeneratedPDFOutputFileName).mockReturnValue('output.pdf');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle files successfully and generate compressed PDF', async () => {
    const wrapper = mount(MainArea);
    const files = [
      new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'test2.pdf', { type: 'application/pdf' }),
    ];

    // Add files first
    await wrapper.vm.addFiles(files);

    // Call the method directly instead of clicking button
    // @ts-expect-error: accessing private method
    await wrapper.vm.mergeAndCompressPDF();
    await flushPromises();

    // Verify the PDF processing functions were called
    expect(pdfUtils.mergePdfFiles).toHaveBeenCalledWith(files);
    expect(pdfUtils.renderPdfToCanvases).toHaveBeenCalled();
    expect(pdfUtils.createCompressedPdfFromImages).toHaveBeenCalledWith(
      [expect.any(HTMLCanvasElement)],
      { maxSizeBytes: 1000000 }, // Default 1MB
    );

    // Verify the blob was created
    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'application/pdf' }),
    );

    // Verify the download filename was set
    expect(fileUtils.getGeneratedPDFOutputFileName).toHaveBeenCalled();

    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.compressedPDF).toBe(mockObjectURL);
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.fileSize).toBe(1000);
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.downloadFileName).toBe('output.pdf');
  });

  it('should handle errors during PDF processing', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const testError = new Error('Processing failed');
    vi.mocked(pdfUtils.mergePdfFiles).mockRejectedValue(testError);

    const wrapper = mount(MainArea);
    const files = [new File(['content'], 'test.pdf', { type: 'application/pdf' })];

    // Add files
    await wrapper.vm.addFiles(files);

    // Call the method directly instead of clicking button
    // @ts-expect-error: accessing private method
    await wrapper.vm.mergeAndCompressPDF();
    await flushPromises();

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(testError);

    // Verify no PDF was created
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.compressedPDF).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should reset compressed PDF when pdfFiles change', async () => {
    const wrapper = mount(MainArea);

    // Set up initial compressed PDF state
    // @ts-expect-error: accessing private ref
    wrapper.vm.compressedPDF = mockObjectURL;
    // @ts-expect-error: accessing private ref
    wrapper.vm.fileSize = 1000;

    // Add a new file (which triggers the watcher)
    const newFile = new File(['new'], 'new.pdf', { type: 'application/pdf' });
    await wrapper.vm.addFiles([newFile]);
    await flushPromises();

    // Verify reset was called
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.compressedPDF).toBeNull();
    // @ts-expect-error: accessing private ref
    expect(wrapper.vm.fileSize).toBe(0);
  });

  it('should clean up resources on unmount', async () => {
    const wrapper = mount(MainArea);

    // Set up compressed PDF
    // @ts-expect-error: accessing private ref
    wrapper.vm.compressedPDF = mockObjectURL;

    // Unmount the component
    wrapper.unmount();

    // Verify cleanup was called
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
  });
});
