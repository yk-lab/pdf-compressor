/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { describe, it, expect, vi } from 'vitest';
import * as pdfjsLib from 'pdfjs-dist';
import {
  renderPdfToCanvases,
  mergePdfFiles,
  createCompressedPdfFromImages,
  PDFCompressionSizeError,
  isPdf,
  isImage,
  loadImageToCanvas,
} from './pdf';
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';

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

describe('PDF Utilities', () => {
  describe('loadImageToCanvas', () => {
    it('should successfully load an image to canvas', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      // Save original implementations
      const originalImage = global.Image;
      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;
      const originalCreateElement = document.createElement.bind(document);

      // Mock Image
      let onloadCallback: (() => void) | null = null;
      global.Image = vi.fn().mockImplementation(() => {
        const img: any = {
          width: 200,
          height: 150,
          onerror: null,
        };

        Object.defineProperty(img, 'onload', {
          set: (handler: () => void) => {
            onloadCallback = handler;
          },
        });

        Object.defineProperty(img, 'src', {
          set: () => {
            setTimeout(() => {
              if (onloadCallback) onloadCallback();
            }, 0);
          },
        });

        return img;
      }) as unknown as typeof Image;

      // Mock URL methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      // Mock canvas
      const mockCtx = {
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
      };

      vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
        if (tag === 'canvas') {
          return mockCanvas as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });

      await loadImageToCanvas(imageFile);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(imageFile);
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(150);
      expect(mockCtx.fillStyle).toBe('#FFFFFF');
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 200, 150);
      expect(mockCtx.drawImage).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

      // Cleanup
      vi.restoreAllMocks();
      global.Image = originalImage;
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should handle image load error', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      // Save original implementations
      const originalImage = global.Image;
      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;

      // Mock Image with error
      let onerrorCallback: (() => void) | null = null;
      global.Image = vi.fn().mockImplementation(() => {
        const img: any = {
          onload: null,
        };

        Object.defineProperty(img, 'onerror', {
          set: (handler: () => void) => {
            onerrorCallback = handler;
          },
        });

        Object.defineProperty(img, 'src', {
          set: () => {
            setTimeout(() => {
              if (onerrorCallback) onerrorCallback();
            }, 0);
          },
        });

        return img;
      }) as unknown as typeof Image;

      // Mock URL methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      await expect(loadImageToCanvas(imageFile)).rejects.toThrow('Failed to load image');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

      // Cleanup
      global.Image = originalImage;
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should handle missing canvas context', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      // Save original implementations
      const originalImage = global.Image;
      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;
      const originalCreateElement = document.createElement.bind(document);

      // Mock Image
      let onloadCallback: (() => void) | null = null;
      global.Image = vi.fn().mockImplementation(() => {
        const img: any = {
          width: 200,
          height: 150,
          onerror: null,
        };

        Object.defineProperty(img, 'onload', {
          set: (handler: () => void) => {
            onloadCallback = handler;
          },
        });

        Object.defineProperty(img, 'src', {
          set: () => {
            setTimeout(() => {
              if (onloadCallback) onloadCallback();
            }, 0);
          },
        });

        return img;
      }) as unknown as typeof Image;

      // Mock URL methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      // Mock canvas with null context
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      };

      vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
        if (tag === 'canvas') {
          return mockCanvas as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });

      await expect(loadImageToCanvas(imageFile)).rejects.toThrow('Failed to get canvas context');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');

      // Cleanup
      vi.restoreAllMocks();
      global.Image = originalImage;
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
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
      // Very large valid JPEG base64 that will exceed size limit
      const largeJpegBase64 =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAEAAQADASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAAAQIAAwQFBgcI/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD' +
        'A'.repeat(10000) +
        '//Z';
      const mockCanvas = {
        toDataURL: vi.fn().mockReturnValue(largeJpegBase64),
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
      const mockCanvas = {
        toDataURL: vi
          .fn()
          .mockReturnValue(
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k=',
          ),
        width: 100,
        height: 100,
      } as unknown as HTMLCanvasElement;

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

    it('should handle single image file', async () => {
      const jpegFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      // Save original implementations
      const originalImage = global.Image;
      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;
      const originalCreateElement = document.createElement.bind(document);

      // Mock Image
      let onloadCallback: (() => void) | null = null;
      global.Image = vi.fn().mockImplementation(() => {
        const img: any = {
          width: 200,
          height: 150,
          onerror: null,
        };

        Object.defineProperty(img, 'onload', {
          set: (handler: () => void) => {
            onloadCallback = handler;
          },
        });

        Object.defineProperty(img, 'src', {
          set: () => {
            setTimeout(() => {
              if (onloadCallback) onloadCallback();
            }, 0);
          },
        });

        return img;
      }) as unknown as typeof Image;

      // Mock URL methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      // Mock canvas
      const mockCtx = {
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
        toDataURL: vi
          .fn()
          .mockReturnValue(
            'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k=',
          ),
      };

      vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
        if (tag === 'canvas') {
          return mockCanvas as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });

      const mergedPdf = await mergePdfFiles([jpegFile]);
      expect(mergedPdf.numPages).toBe(1);

      // Cleanup
      vi.restoreAllMocks();
      global.Image = originalImage;
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
    });
  });

  describe('renderPdfToCanvases', () => {
    it('should render PDF pages to canvases', async () => {
      const pdfDoc = await PDFDocument.create();
      await createPage(pdfDoc);
      await createPage(pdfDoc); // Add second page
      const pdfData = await pdfDoc.save();

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

      const canvases = await renderPdfToCanvases(pdf);

      expect(canvases).toHaveLength(2);
      expect(canvases[0]).toBeInstanceOf(HTMLCanvasElement);
      expect(canvases[1]).toBeInstanceOf(HTMLCanvasElement);
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

  describe.skip('PDF Processing', () => {
    it('should render PDF to canvases', async () => {
      const pdfDoc = await PDFDocument.create();
      await createPage(pdfDoc);
      const pdf = await pdfjsLib.getDocument({ data: await pdfDoc.save() }).promise;

      const canvases = await renderPdfToCanvases(pdf);
      expect(canvases.length).toBe(pdf.numPages);
      expect(canvases.length).toBe(1);
      canvases.forEach((canvas) => {
        expect(canvas).toBeInstanceOf(HTMLCanvasElement);
      });
    });

    it('should merge multiple PDF files', async () => {
      const pdfDoc1 = await PDFDocument.create();
      const pdfDoc2 = await PDFDocument.create();
      await createPage(pdfDoc1);
      await createPage(pdfDoc2);
      await createPage(pdfDoc2);

      const data1 = await pdfDoc1.save();
      const data2 = await pdfDoc2.save();

      const pdfFile1 = new File([data1], 'sample1.pdf', { type: 'application/pdf' });
      const pdfFile2 = new File([data2], 'sample2.pdf', { type: 'application/pdf' });

      pdfFile1.arrayBuffer = vi.fn().mockResolvedValue(await generateArrayBuffer(data1));
      pdfFile2.arrayBuffer = vi.fn().mockResolvedValue(await generateArrayBuffer(data2));

      const mergedPdf = await mergePdfFiles([pdfFile1, pdfFile2]);
      expect(mergedPdf.numPages).toBe(3);
    });

    it('should create a compressed PDF from images', async () => {
      const pdfDoc = await PDFDocument.create();
      await createPage(pdfDoc);

      const canvases = await renderPdfToCanvases(
        await pdfjsLib.getDocument({ data: await pdfDoc.save() }).promise,
      );
      const compressedPdf = await createCompressedPdfFromImages(canvases);
      expect(compressedPdf.byteLength).toBeLessThanOrEqual(1_000_000);
    });

    it('should merge PDF and image files together', async () => {
      // Create a test PDF file
      const pdfDoc = await PDFDocument.create();
      await createPage(pdfDoc);
      const pdfData = await pdfDoc.save();
      const pdfFile = new File([pdfData], 'test.pdf', { type: 'application/pdf' });
      pdfFile.arrayBuffer = vi.fn().mockResolvedValue(await generateArrayBuffer(pdfData));

      // Create a test image file (mock canvas toDataURL)
      const mockImageData =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k=';
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });

      // Save original implementations
      const originalImage = global.Image;
      const originalCreateObjectURL = global.URL.createObjectURL;
      const originalRevokeObjectURL = global.URL.revokeObjectURL;
      const originalCreateElement = document.createElement.bind(document);

      // Mock Image with proper onload setter support
      global.Image = vi.fn().mockImplementation(() => {
        const listeners: Record<string, Function[]> = {};
        let _src = '';
        let _onload: ((event: Event) => void) | null = null;
        const img: any = {
          width: 100,
          height: 100,
          onerror: null,
          addEventListener: (event: string, handler: any) => {
            if (!listeners[event]) {
              listeners[event] = [];
            }
            listeners[event].push(handler);
          },
        };

        // Define onload property with setter
        Object.defineProperty(img, 'onload', {
          get: () => _onload,
          set: (handler: ((event: Event) => void) | null) => {
            _onload = handler;
          },
        });

        // Define src property with setter that triggers load
        Object.defineProperty(img, 'src', {
          get: () => _src,
          set: (value: string) => {
            _src = value;
            setTimeout(() => {
              const event = new Event('load');
              if (_onload) _onload(event);
              if (listeners['load']) {
                listeners['load'].forEach((fn) => fn(event));
              }
            }, 0);
          },
        });

        return img;
      }) as unknown as typeof Image;

      // Mock URL methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toDataURL: vi.fn().mockReturnValue(mockImageData),
        toBlob: vi.fn((callback) => {
          const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
          callback(blob);
        }),
        width: 100,
        height: 100,
      };

      // Mock createElement without recursion
      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockImplementation((tag: any) => {
          if (tag === 'canvas') {
            return mockCanvas as unknown as HTMLCanvasElement;
          }
          return originalCreateElement(tag);
        });

      const mergedPdf = await mergePdfFiles([pdfFile, imageFile]);
      expect(mergedPdf.numPages).toBe(2); // 1 page from PDF + 1 page from image

      // Cleanup: restore original implementations
      createElementSpy.mockRestore();
      global.Image = originalImage;
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
    });
  });
});
