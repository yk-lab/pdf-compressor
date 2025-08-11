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
export const isPdf = (file: File): boolean => {
  return file.type === 'application/pdf';
};

/* File が画像かどうかを判定する
 * @param file File
 * @return 画像かどうか
 */
export const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const isImage = (file: File): boolean => supportedImageTypes.has(file.type);

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

/* 複数のPDFファイルと画像ファイルを結合する関数
 * @param files PDFまたは画像ファイルの配列
 * @return 結合したPDFファイル
 */
export const mergePdfFiles = async (files: File[]): Promise<PDFDocumentProxy> => {
  if (files.length === 0) {
    throw new Error('At least one file is required.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    if (isPdf(file)) {
      // PDFファイルの場合
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } else if (isImage(file)) {
      // 画像ファイルの場合
      const canvas = await loadImageToCanvas(file);

      // 画像が1MBを超える場合は圧縮（正確なサイズ判定のため toBlob を使用）
      let quality = 1.0;
      const toJpegBlob = async (q: number): Promise<Blob> =>
        await new Promise((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Failed to encode JPEG'))),
            'image/jpeg',
            q,
          ),
        );

      let blob = await toJpegBlob(quality);
      while (blob.size > 1_000_000 && quality > 0.1) {
        quality = Math.max(0.1, quality - 0.1);
        blob = await toJpegBlob(quality);
      }

      const jpgBytes = new Uint8Array(await blob.arrayBuffer());
      const jpgImage = await mergedPdf.embedJpg(jpgBytes);
      const page = mergedPdf.addPage([jpgImage.width, jpgImage.height]);
      page.drawImage(jpgImage, { x: 0, y: 0, width: jpgImage.width, height: jpgImage.height });
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  }

  return await pdfjsLib.getDocument({ data: await mergedPdf.save(), cMapUrl, cMapPacked: true })
    .promise;
};

/**
 * Canvasの配列からサイズ圧縮したPDFを生成する
 * @param pages Canvasの配列
 * @param maxSizeBytes 最大ファイルサイズ
 */
/* 画像ファイルをCanvasに読み込む関数
 * @param file 画像ファイル
 * @param maxPixels 最大ピクセル数（デフォルト: 4096x4096）
 * @return 描画したCanvas
 */
export async function loadImageToCanvas(
  file: File,
  maxPixels = 4096 * 4096,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        // デコード完了を待つ
        await img.decode();

        // 最大サイズ制限のチェック
        let width = img.width;
        let height = img.height;
        const currentPixels = width * height;

        if (currentPixels > maxPixels) {
          // 縦横比を維持しながらリサイズ
          const scale = Math.sqrt(maxPixels / currentPixels);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        // 透過画像の場合のために白い背景を先に描画
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // その上に画像を描画（リサイズが必要な場合は縮小）
        ctx.drawImage(img, 0, 0, width, height);

        URL.revokeObjectURL(url);
        resolve(canvas);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to process image: ${error}`));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export async function createCompressedPdfFromImages(
  pages: HTMLCanvasElement[],
  {
    maxSizeBytes = 1_000_000,
    cutQuality = 0.04,
  }: {
    maxSizeBytes?: number;
    cutQuality?: number;
  } = {},
): Promise<Uint8Array> {
  let quality = 1.0;

  // Canvas を Blob に変換するヘルパー関数
  const canvasToJpegBlob = async (canvas: HTMLCanvasElement, q: number): Promise<Blob> =>
    await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode JPEG'))),
        'image/jpeg',
        q,
      ),
    );

  while (quality >= cutQuality) {
    const pdfDoc = await PDFDocument.create();
    for (const canvas of pages) {
      const blob = await canvasToJpegBlob(canvas, quality);
      const jpgBytes = new Uint8Array(await blob.arrayBuffer());
      const jpgImage = await pdfDoc.embedJpg(jpgBytes);
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
