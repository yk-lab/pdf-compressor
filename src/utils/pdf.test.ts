import { describe, it, expect, vi } from 'vitest';
import * as pdfjsLib from 'pdfjs-dist';
import { renderPdfToCanvases, mergePdfFiles, createCompressedPdfFromImages } from './pdf';
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib'

const createPage = async (pdfDoc: PDFDocument): Promise<PDFPage> => {
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage([600, 400]);
  const { height } = page.getSize();
  const fontSize = 30;
  page.drawText("Creating PDFs in JavaScript is awesome!", {
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
}

describe.todo('PDF Utilities', () => {
  it('should render PDF to canvases', async () => {
    const pdfDoc = await PDFDocument.create();
    await createPage(pdfDoc);
    const pdf = await pdfjsLib.getDocument({ data: await pdfDoc.save() }).promise;

    const canvases = await renderPdfToCanvases(pdf);
    expect(canvases.length).toBe(pdf.numPages);
    expect(canvases.length).toBe(1);
    canvases.forEach(canvas => {
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

    const canvases = await renderPdfToCanvases(await pdfjsLib.getDocument({ data: await pdfDoc.save() }).promise);
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
    const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k=';
    const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock Image and Canvas APIs for image file
    global.Image = vi.fn().mockImplementation(() => ({
      onload: null,
      onerror: null,
      src: '',
      width: 100,
      height: 100,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'load' && handler) {
          setTimeout(() => handler(), 0);
        }
      }),
    }));
    
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();

    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        drawImage: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue(mockImageData),
      width: 100,
      height: 100,
    };
    
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        return mockCanvas as unknown as HTMLCanvasElement;
      }
      return document.createElement(tag);
    });

    const mergedPdf = await mergePdfFiles([pdfFile, imageFile]);
    expect(mergedPdf.numPages).toBe(2); // 1 page from PDF + 1 page from image
  });
});
