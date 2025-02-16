import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

const cMapUrl = import.meta.env.DEV ? 'node_modules/pdfjs-dist/cmaps/' : '/assets/cmaps/';

export class PDFCompressionSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFCompressionSizeError';
  }
}

/* File が PDF かどうかを判定する
  * @param file File
  * @return PDF かどうか
  */
const isPdf = (file: File): boolean => {
  return file.type === 'application/pdf';
}

/* PDFファイルをCanvasに描画する関数
  * @param pdf PDFDocumentProxy
  * @param pageNumber ページ番号
  * @param scale 描画スケール
  * @return 描画したCanvas
  */
async function renderPdfPageToCanvas(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale = 1.0,
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d') || new CanvasRenderingContext2D();

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  await page.render(renderContext).promise;
  return canvas;
}

/* PDFファイルをCanvasに描画する関数
  * @param pdf PDFDocumentProxy
  * @param pageNumber ページ番号
  * @param scale 描画スケール
  * @return 描画したCanvas
  */
export async function renderPdfToCanvases(
  pdf: PDFDocumentProxy,
  {
    scale = 1.0,
  }: {
    scale?: number;
  } = {},
): Promise<HTMLCanvasElement[]> {
  const canvases = [];
  for (let i = 0; i < pdf.numPages; i++) {
    const canvas = await renderPdfPageToCanvas(pdf, i + 1, scale);
    canvases.push(canvas);
  }
  return canvases;
}

/* 複数のPDFファイルを結合する関数
  * @param files PDFファイルの配列
  * @return 結合したPDFファイル
  */
export const mergePdfFiles = async (files: File[]): Promise<PDFDocumentProxy> => {
  if (files.length === 0) {
    throw new Error("At least one PDF file is required.");
  }
  if (files.some((file) => !isPdf(file))) {
    throw new Error("Valid PDF files are required.");
  }

  const mergedPdf = await PDFDocument.create();
  for (const file of files) {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await pdfjsLib.getDocument({ data: await mergedPdf.save(), cMapUrl, cMapPacked: true }).promise;
}

/**
 * Canvasの配列からサイズ圧縮したPDFを生成する
 * @param pages Canvasの配列
 * @param maxSizeBytes 最大ファイルサイズ
 */
export async function createCompressedPdfFromImages(
  pages: HTMLCanvasElement[],
  {
    maxSizeBytes = 1_000_000,
    cutQuality = 0.1,
  }: {
    maxSizeBytes?: number;
    cutQuality?: number;
  } = {},
): Promise<Uint8Array> {
  let quality = 1.0;

  while (quality >= cutQuality) {
    const pdfDoc = await PDFDocument.create();
    for (const canvas of pages) {
      const jpgImage = await pdfDoc.embedJpg(canvas.toDataURL('image/jpeg', quality));
      const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
      page.drawImage(jpgImage, { x: 0, y: 0, width: jpgImage.width, height: jpgImage.height });
    }

    const outBytes = await pdfDoc.save();
    if (outBytes.byteLength <= maxSizeBytes) {
      return outBytes;
    } else {
      // サイズが大きければ品質を下げて再試行
      quality -= 0.02;
    }
  }

  // 足切り品質でも制限以下にならなかった場合はエラー
  throw new PDFCompressionSizeError('Could not compress PDF under the given size limit.');
}
