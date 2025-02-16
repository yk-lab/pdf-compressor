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
import { computed, ref } from 'vue';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { getGeneratedPDFOutputFileName } from '@/utils/file';
import { mergePdfFiles, renderPdfToCanvases, createCompressedPdfFromImages } from '@/utils/pdf';

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

// メイン処理例
async function handlePdfFiles(files: File[]) {
  // 画像を品質調整しながら1つのPDFにまとめる
  const compressedPdfBytes = await createCompressedPdfFromImages(
    await renderPdfToCanvases(await mergePdfFiles(files)),
    fileSizeLimit.value,
  );
  fileSize.value = compressedPdfBytes.byteLength;

  // Blobを作成してダウンロード
  const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
  compressedPDF.value = URL.createObjectURL(blob);

  // ダウンロード時のファイル名を設定
  downloadFileName.value = getGeneratedPDFOutputFileName();
}

const mergeAndCompressPDF = () => {
  handlePdfFiles(pdfFiles.value);
};

const filesizeDisplay = computed(() => filesize(fileSize.value));
</script>
