/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as pdfjsLib from 'pdfjs-dist';

// Mock PDF.js worker setup to stabilize tests
vi.mock('pdfjs-dist/build/pdf.worker.mjs?url', () => ({
  default: 'pdfjs-dist/legacy/build/pdf.worker.mjs',
}));

// Set up worker to use legacy build for Node.js environment
// This prevents worker-related errors and stabilizes tests
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

import {
  renderPdfToCanvases,
  mergePdfFiles,
  createCompressedPdfFromImages,
  PDFCompressionSizeError,
  isPdf,
  isImage,
  loadImageToCanvas,
} from '@/utils/pdf';
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';
import type { BlobCallback } from '@/utils/types';

// Mock setup helpers
interface MockImageSetup {
  originalImage: typeof Image;
  originalCreateObjectURL: typeof URL.createObjectURL;
  originalRevokeObjectURL: typeof URL.revokeObjectURL;
}

// Reusable valid JPEG data (1x1 black pixel)
const createValidJpegData = (): Uint8Array =>
  new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
    0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
    0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
    0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55,
    0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94,
    0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2,
    0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
    0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6,
    0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda,
    0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd3, 0xff, 0xd9,
  ]);

// Alternative JPEG data with different header
const createAltJpegData = (): Uint8Array =>
  new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x03, 0x02, 0x02, 0x02, 0x02, 0x02, 0x03,
    0x02, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04, 0x06, 0x04, 0x04, 0x04, 0x04, 0x04, 0x08, 0x06,
    0x06, 0x05, 0x06, 0x09, 0x08, 0x0a, 0x0a, 0x09, 0x08, 0x09, 0x09, 0x0a, 0x0c, 0x0f, 0x0c, 0x0a,
    0x0b, 0x0e, 0x0b, 0x09, 0x09, 0x0d, 0x11, 0x0d, 0x0e, 0x0f, 0x10, 0x10, 0x11, 0x10, 0x0a, 0x0c,
    0x12, 0x13, 0x12, 0x10, 0x13, 0x0f, 0x10, 0x10, 0x10, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0a, 0xff, 0xc4, 0x00, 0x14,
    0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x54, 0x50, 0xff, 0xd9,
  ]);

const setupImageMocks = (): MockImageSetup => {
  const originalImage = global.Image;
  const originalCreateObjectURL = global.URL.createObjectURL;
  const originalRevokeObjectURL = global.URL.revokeObjectURL;

  // Mock URL methods
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
  global.URL.revokeObjectURL = vi.fn();

  return {
    originalImage,
    originalCreateObjectURL,
    originalRevokeObjectURL,
  };
};

const cleanupImageMocks = (setup: MockImageSetup) => {
  vi.restoreAllMocks();
  global.Image = setup.originalImage;
  global.URL.createObjectURL = setup.originalCreateObjectURL;
  global.URL.revokeObjectURL = setup.originalRevokeObjectURL;
};

const createMockImage = (
  width = 200,
  height = 150,
  shouldError = false,
  withEventListeners = false,
  decodeError = false,
) => {
  if (withEventListeners) {
    const listeners: Record<string, Array<(e: Event) => void>> = {};
    let _src = '';
    let _onload: ((event: Event) => void) | null = null;
    let _onerror: ((event: Event) => void) | null = null;

    global.Image = vi.fn().mockImplementation(() => {
      const img: any = {
        width,
        height,
        addEventListener: (event: string, handler: (e: Event) => void) => {
          if (!listeners[event]) {
            listeners[event] = [];
          }
          listeners[event].push(handler);
        },
      };

      Object.defineProperty(img, 'onload', {
        get: () => _onload,
        set: (handler: ((event: Event) => void) | null) => {
          _onload = handler;
        },
      });

      Object.defineProperty(img, 'onerror', {
        get: () => _onerror,
        set: (handler: ((event: Event) => void) | null) => {
          _onerror = handler;
        },
      });

      Object.defineProperty(img, 'src', {
        get: () => _src,
        set: (value: string) => {
          _src = value;
          setTimeout(() => {
            if (shouldError) {
              const event = new Event('error');
              if (_onerror) _onerror(event);
              if (listeners['error']) {
                listeners['error'].forEach((fn) => fn(event));
              }
            } else {
              const event = new Event('load');
              if (_onload) _onload(event);
              if (listeners['load']) {
                listeners['load'].forEach((fn) => fn(event));
              }
            }
          }, 0);
        },
      });

      return img;
    }) as unknown as typeof Image;
  } else {
    let onloadCallback: (() => void) | null = null;
    let onerrorCallback: (() => void) | null = null;

    global.Image = vi.fn().mockImplementation(() => {
      const img: any = {
        width,
        height,
        decode: vi.fn().mockImplementation(() => {
          if (decodeError) {
            return Promise.reject(new Error('Decode failed'));
          }
          return Promise.resolve();
        }),
      };

      if (!shouldError) {
        Object.defineProperty(img, 'onload', {
          set: (handler: () => void) => {
            onloadCallback = handler;
          },
        });
        img.onerror = null;
      } else {
        img.onload = null;
        Object.defineProperty(img, 'onerror', {
          set: (handler: () => void) => {
            onerrorCallback = handler;
          },
        });
      }

      Object.defineProperty(img, 'src', {
        set: () => {
          setTimeout(() => {
            if (!shouldError && onloadCallback) onloadCallback();
            if (shouldError && onerrorCallback) onerrorCallback();
          }, 0);
        },
      });

      return img;
    }) as unknown as typeof Image;
  }
};

const createMockCanvas = (
  hasContext = true,
  options: {
    toDataURL?: string;
    toBlob?: boolean;
    width?: number;
    height?: number;
  } = {},
) => {
  const originalCreateElement = document.createElement.bind(document);
  const mockCtx = hasContext
    ? {
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      }
    : null;

  const mockCanvas: any = {
    width: options.width ?? 0,
    height: options.height ?? 0,
    getContext: vi.fn().mockReturnValue(mockCtx),
  };

  if (options.toDataURL) {
    mockCanvas.toDataURL = vi.fn().mockReturnValue(options.toDataURL);
  }

  if (options.toBlob) {
    mockCanvas.toBlob = vi.fn((callback: any) => {
      const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
      callback(blob);
    });
  }

  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
    if (tag === 'canvas') {
      return mockCanvas as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tag);
  });

  return { mockCanvas, mockCtx, spy };
};

// Helper functions for testing
const createPage = async (pdfDoc: PDFDocument): Promise<PDFPage> => {
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage([600, 400]);
  const { height } = page.getSize();
  const fontSize = 30;
  page.drawText('Creating PDFs in JavaScript is awesome!', {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0.53, 0.71),
  });
  return page;
};

const generateArrayBuffer = async (data: Uint8Array) => {
  const arrayBuffer = new ArrayBuffer(data.byteLength);
  const uint8Array = new Uint8Array(arrayBuffer);
  uint8Array.set(data);
  return arrayBuffer;
};

// Create a mock blob with valid JPEG data
const createMockJpegBlob = (size?: number, useAltData = false): Blob => {
  const jpegData = useAltData ? createAltJpegData() : createValidJpegData();
  if (size && size > jpegData.length) {
    // Add padding for larger sizes
    const padding = new Uint8Array(size - jpegData.length).fill(0);
    const largeData = new Uint8Array(size);
    largeData.set(jpegData, 0);
    largeData.set(padding, jpegData.length);
    const blob = new Blob([largeData], { type: 'image/jpeg' });
    blob.arrayBuffer = vi.fn().mockResolvedValue(largeData.buffer);
    return blob;
  }
  const blob = new Blob([jpegData], { type: 'image/jpeg' });
  blob.arrayBuffer = vi.fn().mockResolvedValue(jpegData.buffer);
  return blob;
};

// Create mock canvas with toBlob that returns valid JPEG
const createMockCanvasWithBlob = (
  width = 100,
  height = 100,
  blobOptions?: { size?: number; quality?: number },
) => {
  return {
    toBlob: vi.fn((callback: BlobCallback, _type?: string, quality?: number) => {
      let blob: Blob;
      if (blobOptions?.quality !== undefined && quality === blobOptions.quality) {
        blob = createMockJpegBlob(blobOptions.size);
      } else if (quality === 1.0 && blobOptions?.size) {
        // Simulate uncompressed being larger
        blob = createMockJpegBlob(blobOptions.size * 4);
      } else {
        blob = createMockJpegBlob(blobOptions?.size);
      }
      setTimeout(() => callback(blob), 0);
    }),
    width,
    height,
  } as unknown as HTMLCanvasElement;
};

describe('PDF Utilities', () => {
  describe('loadImageToCanvas', () => {
    it('should successfully load an image to canvas', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      const mockSetup = setupImageMocks();
      createMockImage(200, 150, false, false, false); // shouldError, withEventListeners, decodeError
      const { mockCanvas, mockCtx } = createMockCanvas(true);

      await loadImageToCanvas(imageFile);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(imageFile);
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(150);
      expect(mockCtx!.fillStyle).toBe('#FFFFFF');
      expect(mockCtx!.fillRect).toHaveBeenCalledWith(0, 0, 200, 150);
      expect(mockCtx!.drawImage).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

      cleanupImageMocks(mockSetup);
    });

    it('should handle image load error', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      const mockSetup = setupImageMocks();
      createMockImage(200, 150, true);

      await expect(loadImageToCanvas(imageFile)).rejects.toThrow('Failed to load image');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

      cleanupImageMocks(mockSetup);
    });

    it('should resize large images to fit within max pixels', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const maxPixels = 1000 * 1000; // 1 megapixel

      const mockSetup = setupImageMocks();
      createMockImage(5000, 5000, false); // 25 megapixels
      const { mockCanvas, mockCtx } = createMockCanvas(true);

      await loadImageToCanvas(imageFile, maxPixels);

      // Should resize to fit within 1 megapixel while maintaining aspect ratio
      const expectedSize = Math.floor(5000 * Math.sqrt(maxPixels / (5000 * 5000)));
      expect(mockCanvas.width).toBe(expectedSize);
      expect(mockCanvas.height).toBe(expectedSize);
      expect(mockCtx!.drawImage).toHaveBeenCalledWith(
        expect.any(Object),
        0,
        0,
        expectedSize,
        expectedSize,
      );

      cleanupImageMocks(mockSetup);
    });

    it('should handle decode error gracefully with fallback', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      const mockSetup = setupImageMocks();
      createMockImage(200, 150, false, false, true); // decodeError = true
      createMockCanvas(true);

      // decode エラーがあっても処理は成功するはず（フォールバック動作）
      const result = await loadImageToCanvas(imageFile);
      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      expect(result.getContext).toBeDefined();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

      cleanupImageMocks(mockSetup);
    });

    it('should work without decode method (fallback for older browsers)', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      const mockSetup = setupImageMocks();
      // decode メソッドを持たない Image モック
      (global as any).Image = vi.fn().mockImplementation(() => ({
        width: 200,
        height: 150,
        onload: null,
        onerror: null,
        set src(_v: string) {
          setTimeout(() => this.onload && this.onload(new Event('load')), 0);
        },
        // decode メソッドなし
      })) as unknown as typeof Image;
      createMockCanvas(true);

      const result = await loadImageToCanvas(imageFile);
      expect(result).toBeDefined();
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
      expect(result.getContext).toBeDefined();

      cleanupImageMocks(mockSetup);
    });

    it('should handle missing canvas context', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      const mockSetup = setupImageMocks();
      createMockImage(200, 150, false, false, false); // shouldError, withEventListeners, decodeError
      createMockCanvas(false);

      await expect(loadImageToCanvas(imageFile)).rejects.toThrow('Failed to get canvas context');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

      cleanupImageMocks(mockSetup);
    });
  });

  describe('PDFCompressionSizeError', () => {
    it('should create error with correct name and message', () => {
      const error = new PDFCompressionSizeError('Test error message');
      expect(error.name).toBe('PDFCompressionSizeError');
      expect(error.message).toBe('Test error message');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Helper functions', () => {
    it('should identify PDF files correctly', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const jpegFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      expect(isPdf(pdfFile)).toBe(true);
      expect(isPdf(txtFile)).toBe(false);
      expect(isPdf(jpegFile)).toBe(false);
    });

    it('should identify supported image files correctly', () => {
      const jpegFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['content'], 'test.png', { type: 'image/png' });
      const webpFile = new File(['content'], 'test.webp', { type: 'image/webp' });
      const gifFile = new File(['content'], 'test.gif', { type: 'image/gif' });
      const bmpFile = new File(['content'], 'test.bmp', { type: 'image/bmp' });
      const svgFile = new File(['content'], 'test.svg', { type: 'image/svg+xml' });
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      // Supported formats
      expect(isImage(jpegFile)).toBe(true);
      expect(isImage(pngFile)).toBe(true);
      expect(isImage(webpFile)).toBe(true);
      expect(isImage(gifFile)).toBe(true);

      // Unsupported formats
      expect(isImage(bmpFile)).toBe(false);
      expect(isImage(svgFile)).toBe(false);
      expect(isImage(pdfFile)).toBe(false);
    });

    it('should handle empty file types', () => {
      const noTypeFile = new File(['content'], 'test', { type: '' });
      expect(isPdf(noTypeFile)).toBe(false);
      expect(isImage(noTypeFile)).toBe(false);
    });
  });

  describe('createCompressedPdfFromImages', () => {
    it('should throw PDFCompressionSizeError when cannot compress below limit', async () => {
      // Create mock canvas that always returns large blob
      const largeBlob = createMockJpegBlob(200000);
      const mockCanvas = {
        toBlob: vi.fn((callback: BlobCallback) => {
          setTimeout(() => callback(largeBlob), 0);
        }),
        width: 1000,
        height: 1000,
      } as unknown as HTMLCanvasElement;

      const canvases = [mockCanvas];

      await expect(
        createCompressedPdfFromImages(canvases, { maxSizeBytes: 100, cutQuality: 0.5 }),
      ).rejects.toThrow(PDFCompressionSizeError);

      await expect(
        createCompressedPdfFromImages(canvases, { maxSizeBytes: 100, cutQuality: 0.5 }),
      ).rejects.toThrow('Could not compress PDF under the given size limit.');
    });

    it('should successfully compress when size is within limit', async () => {
      const mockCanvas = createMockCanvasWithBlob(100, 100, { size: 500 });

      const canvases = [mockCanvas];
      const result = await createCompressedPdfFromImages(canvases, { maxSizeBytes: 1000000 });

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.byteLength).toBeGreaterThan(0);
      expect(result.byteLength).toBeLessThanOrEqual(1000000);
    });
  });

  describe('mergePdfFiles', () => {
    it('should throw error when no files provided', async () => {
      await expect(mergePdfFiles([])).rejects.toThrow('At least one file is required.');
    });

    it('should throw error for unsupported file type', async () => {
      const txtFile = new File(['text content'], 'test.txt', { type: 'text/plain' });

      await expect(mergePdfFiles([txtFile])).rejects.toThrow('Unsupported file type: text/plain');
    });

    it('should handle single PDF file', async () => {
      const pdfDoc = await PDFDocument.create();
      await createPage(pdfDoc);
      const pdfData = await pdfDoc.save();
      const pdfFile = new File([pdfData], 'test.pdf', { type: 'application/pdf' });

      pdfFile.arrayBuffer = vi.fn().mockResolvedValue(await generateArrayBuffer(pdfData));

      const mergedPdf = await mergePdfFiles([pdfFile]);
      expect(mergedPdf.numPages).toBe(1);
    });

    it('should handle single image file and compress large images', async () => {
      const jpegFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      // Mock Image constructor
      const originalImage = global.Image;
      const imgElement = {
        width: 200,
        height: 150,
        decode: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onload: null as any,
        onerror: null as any,
        src: '',
      };

      // Setup onload/onerror property setters
      Object.defineProperty(imgElement, 'onload', {
        set: function (handler: () => void) {
          setTimeout(() => handler(), 0);
        },
        configurable: true,
      });

      global.Image = vi.fn().mockImplementation(() => imgElement) as unknown as typeof Image;

      // Mock canvas with toBlob support
      const originalCreateElement = document.createElement.bind(document);
      const mockToBlob = vi.fn((callback: BlobCallback, _type?: string, quality?: number) => {
        // Simulate large image that needs compression
        const blob =
          quality === 1.0 ? createMockJpegBlob(2_000_000) : createMockJpegBlob(500_000, true);
        setTimeout(() => callback(blob), 0);
      });

      vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
        if (tag === 'canvas') {
          const mockCanvas = {
            width: 0,
            height: 0,
            getContext: vi.fn(() => ({
              fillStyle: '',
              fillRect: vi.fn(),
              drawImage: vi.fn(),
            })),
            toBlob: mockToBlob,
          };
          return mockCanvas as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });

      // Mock URL.createObjectURL
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      URL.revokeObjectURL = vi.fn();

      try {
        const mergedPdf = await mergePdfFiles([jpegFile]);
        expect(mergedPdf.numPages).toBe(1);

        // Verify toBlob was called twice with correct quality values
        expect(mockToBlob).toHaveBeenCalledTimes(2);
        expect(mockToBlob).toHaveBeenNthCalledWith(1, expect.any(Function), 'image/jpeg', 1.0);
        expect(mockToBlob).toHaveBeenNthCalledWith(2, expect.any(Function), 'image/jpeg', 0.9);
      } finally {
        // Cleanup
        global.Image = originalImage;
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        vi.restoreAllMocks();
      }
    });
  });

  describe('renderPdfToCanvases', () => {
    beforeEach(() => {
      // Mock canvas creation for pdf.js rendering
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          const mockCanvas = originalCreateElement('canvas') as HTMLCanvasElement;
          // Ensure getContext returns a valid context
          const mockContext = {
            canvas: mockCanvas,
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            scale: vi.fn(),
            translate: vi.fn(),
            transform: vi.fn(),
            setTransform: vi.fn(),
            resetTransform: vi.fn(),
            getTransform: vi.fn(() => new DOMMatrix()),
            createImageData: vi.fn(),
            getImageData: vi.fn(() => ({
              data: new Uint8ClampedArray(4),
              width: 1,
              height: 1,
              colorSpace: 'srgb' as any,
            })),
            putImageData: vi.fn(),
            imageSmoothingEnabled: true,
            fillStyle: '',
            strokeStyle: '',
            globalAlpha: 1,
            globalCompositeOperation: 'source-over',
            font: '10px sans-serif',
            textAlign: 'start' as CanvasTextAlign,
            textBaseline: 'alphabetic' as CanvasTextBaseline,
            direction: 'ltr' as CanvasDirection,
            lineCap: 'butt' as CanvasLineCap,
            lineDashOffset: 0,
            lineJoin: 'miter' as CanvasLineJoin,
            lineWidth: 1,
            miterLimit: 10,
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            beginPath: vi.fn(),
            closePath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            rect: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            clip: vi.fn(),
            measureText: vi.fn(() => ({
              width: 0,
              actualBoundingBoxLeft: 0,
              actualBoundingBoxRight: 0,
              fontBoundingBoxAscent: 0,
              fontBoundingBoxDescent: 0,
              actualBoundingBoxAscent: 0,
              actualBoundingBoxDescent: 0,
            })),
            fillText: vi.fn(),
            strokeText: vi.fn(),
            createLinearGradient: vi.fn(() => ({
              addColorStop: vi.fn(),
            })),
            createRadialGradient: vi.fn(() => ({
              addColorStop: vi.fn(),
            })),
            createPattern: vi.fn(),
            arc: vi.fn(),
            arcTo: vi.fn(),
            bezierCurveTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            getLineDash: vi.fn(() => []),
            setLineDash: vi.fn(),
            rotate: vi.fn(),
            isPointInPath: vi.fn(),
            isPointInStroke: vi.fn(),
            drawFocusIfNeeded: vi.fn(),
            ellipse: vi.fn(),
            filter: 'none',
            getContextAttributes: vi.fn(() => ({ alpha: true })),
            createImageBitmap: vi.fn(),
            createConicGradient: vi.fn(),
          };
          mockCanvas.getContext = vi.fn(() => mockContext as any);
          mockCanvas.toBlob = vi.fn((callback: BlobCallback) => {
            const validJpegData = createValidJpegData();
            const blob = new Blob([validJpegData], { type: 'image/jpeg' });
            setTimeout(() => callback(blob), 0);
          });
          return mockCanvas;
        }
        return originalCreateElement(tagName);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should render with custom scale', async () => {
      const pdfDoc = await PDFDocument.create();
      await createPage(pdfDoc);
      const pdfData = await pdfDoc.save();

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

      const canvases = await renderPdfToCanvases(pdf, { scale: 2.0 });

      expect(canvases).toHaveLength(1);
      expect(canvases[0]).toBeInstanceOf(HTMLCanvasElement);
    });
  });
});
