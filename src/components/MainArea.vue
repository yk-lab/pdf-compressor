<template>
  <div>
    <label class="block">
      <span class="sr-only">ファイルを選択</span>
      <input
        type="file"
        class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
        multiple
        @change="handleFiles"
        accept=".pdf"
      />
    </label>

    <button
      class="block w-full text-sm text-white bg-cyan-600 hover:bg-cyan-500 py-2 px-4 rounded font-semibold mt-4 disabled:opacity-50"
      @click="mergeAndCompressPDF"
      :disabled="pdfFiles.length === 0"
    >
      PDFを結合・ファイルサイズ縮小
    </button>

    <div v-if="compressedPDF" class="mt-4">
      <a
        :href="compressedPDF"
        :download="downloadFileName"
        class="text-cyan-600 underline hover:text-cyan-500 mt-4 hover:underline text-lg font-semibold"
      >
        PDFをダウンロード
        <span class="text-base font-medium"> ({{ filesizeDisplay }}) </span>
      </a>
      <p class="text-sm text-gray-500">
        ※ファイルサイズは目安です。実際のファイルサイズはブラウザによって異なります。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as pdfjsLib from 'pdfjs-dist';
import filesize from 'filesize.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { computed, ref } from 'vue';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

const cMapUrl = import.meta.env.DEV ? 'node_modules/pdfjs-dist/cmaps/' : '/assets/cmaps/';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const pdfFiles = ref<File[]>([]); // 選択されたPDFファイル
const compressedPDF = ref<string | null>(null); // 圧縮後のPDF Blob URL
const fileSize = ref(0); // 圧縮後のファイルサイズ
const fileSizeLimit = ref(1_000_000); // 圧縮後のファイルサイズの上限 (1MB)
const downloadFileName = ref('compressed.pdf'); // ダウンロード時のファイル名

const handleFiles = async (event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) throw new TypeError();
  pdfFiles.value = Array.from(event.target.files ?? []);
  compressedPDF.value = null;
};

// PDFをCanvasとして描画する関数
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

// PDFファイルから全ページをCanvasに変換して画像DataURLを取得する
async function pdfToPageImages(file: File, scale = 1.0): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, cMapUrl: cMapUrl, cMapPacked: true })
    .promise;
  const numPages = pdf.numPages;
  const images: string[] = [];
  for (let i = 1; i <= numPages; i++) {
    const canvas = await renderPdfPageToCanvas(pdf, i, scale);
    // 一旦PNGとしてDataURL取得
    const dataUrl = canvas.toDataURL('image/png');
    images.push(dataUrl);
  }
  return images;
}

// 複数のPDFファイルから得た画像一覧を品質調整しながらpdf-libで1つのPDFにまとめる
async function createCompressedPdfFromImages(
  imageDataUrls: string[],
  maxSizeBytes = 1_000_000,
): Promise<Uint8Array> {
  let quality = 1.0;
  let pdfBytes: Uint8Array | null = null;

  while (quality > 0.1) {
    const pdfDoc = await PDFDocument.create();
    for (const imgUrl of imageDataUrls) {
      // qualityを反映するため、一度Canvasなどで再エンコードする
      const reEncodedUrl = await reEncodeImage(imgUrl, 'image/jpeg', quality);
      const imageBytes = await (await fetch(reEncodedUrl)).arrayBuffer();
      const jpgImage = await pdfDoc.embedJpg(new Uint8Array(imageBytes));

      const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
      page.drawImage(jpgImage, { x: 0, y: 0, width: jpgImage.width, height: jpgImage.height });
    }

    const outBytes = await pdfDoc.save();
    if (outBytes.byteLength <= maxSizeBytes) {
      pdfBytes = outBytes;
      break;
    } else {
      // サイズが大きければ品質を下げて再試行
      quality -= 0.02;
    }
  }

  if (!pdfBytes) {
    // 最低品質でも1MB以下にならなかった場合は最終結果を返すか、エラーを投げる
    throw new Error('Could not compress PDF under the given size limit.');
  }

  return pdfBytes;
}

/**
 * 画像を再エンコードするためのヘルパー関数
 * @param dataUrl - 元の画像のデータURL
 * @param mimeType - 出力する画像のMIMEタイプ
 * @param quality - 圧縮品質（0.0 ~ 1.0）
 * @returns 再エンコードされた画像のデータURL
 */
async function reEncodeImage(dataUrl: string, mimeType: string, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      offscreen.width = img.width;
      offscreen.height = img.height;
      const ctx = offscreen.getContext('2d');
      ctx?.drawImage(img, 0, 0, img.width, img.height);
      const newDataUrl = offscreen.toDataURL(mimeType, quality);
      resolve(newDataUrl);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// メイン処理例
async function handlePdfFiles(files: File[]) {
  // 全PDFの全ページ画像を取得
  let allPagesImages: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const pages = await pdfToPageImages(file);
    allPagesImages = allPagesImages.concat(pages);
  }

  // 画像を品質調整しながら1つのPDFにまとめる
  const compressedPdfBytes = await createCompressedPdfFromImages(
    allPagesImages,
    fileSizeLimit.value,
  );
  fileSize.value = compressedPdfBytes.byteLength;

  // Blobを作成してダウンロード
  const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
  compressedPDF.value = URL.createObjectURL(blob);

  // ダウンロード時のファイル名を設定
  downloadFileName.value = getFormattedFilename();
}

const mergeAndCompressPDF = () => {
  handlePdfFiles(pdfFiles.value);
};

const getFormattedFilename = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hour}${minute}${second}.pdf`;
};

const filesizeDisplay = computed(() => {
  return filesize(fileSize.value);
});
</script>
