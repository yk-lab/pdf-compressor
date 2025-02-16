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
});
