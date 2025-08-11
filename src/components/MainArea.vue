<template>
  <div>
    <FileUploadZone :has-files="pdfFiles.length > 0" @add-files="addFiles" />

    <FileList class="mt-4" v-model="pdfFiles" />

    <button
      class="block w-full text-sm text-white bg-cyan-600 hover:bg-cyan-500 py-2 px-4 rounded font-semibold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="mergeAndCompressPDF"
      :disabled="pdfFiles.length === 0"
    >
      PDFを結合・ファイルサイズ縮小
    </button>

    <DownloadSection :download-url="compressedPDF" :file-name="downloadFileName" :size="fileSize" />
  </div>
</template>

<script setup lang="ts">
import * as pdfjsLib from 'pdfjs-dist';
import { ref, watch, onUnmounted } from 'vue';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { getGeneratedPDFOutputFileName } from '@/utils/file';
import { mergePdfFiles, renderPdfToCanvases, createCompressedPdfFromImages } from '@/utils/pdf';
import FileUploadZone from './FileUploadZone.vue';
import FileList from './FileList.vue';
import DownloadSection from './DownloadSection.vue';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const pdfFiles = ref<{ id: string; file: File }[]>([]); // 選択されたファイル（PDF/画像）
const compressedPDF = ref<string | null>(null); // 圧縮後のPDF Blob URL
const fileSize = ref(0); // 圧縮後のファイルサイズ
const fileSizeLimit = ref(1_000_000); // 圧縮後のファイルサイズの上限 (1MB)
const downloadFileName = ref('compressed.pdf'); // ダウンロード時のファイル名

const resetCompressedPDF = () => {
  if (compressedPDF.value) {
    URL.revokeObjectURL(compressedPDF.value);
  }
  compressedPDF.value = null;
  fileSize.value = 0;
};

const addFiles = (files: File[]): void => {
  pdfFiles.value.push(...files.map((file) => ({ id: crypto.randomUUID(), file })));
  resetCompressedPDF();
};

// メイン処理
async function handleFiles(files: File[]) {
  // 画像を品質調整しながら1つのPDFにまとめる
  const compressedPdfBytes = await createCompressedPdfFromImages(
    await renderPdfToCanvases(await mergePdfFiles(files)),
    {
      maxSizeBytes: fileSizeLimit.value,
    },
  );
  fileSize.value = compressedPdfBytes.byteLength;

  // Blobを作成してダウンロード
  const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
  compressedPDF.value = URL.createObjectURL(blob);

  // ダウンロード時のファイル名を設定
  downloadFileName.value = getGeneratedPDFOutputFileName();
}

const mergeAndCompressPDF = async () => {
  try {
    await handleFiles(pdfFiles.value.map((f) => f.file));
  } catch (err) {
    // TODO: UI通知（トースト/アラート等）に置き換え
    console.error(err);
  }
};

watch(
  pdfFiles,
  () => {
    resetCompressedPDF();
  },
  { deep: true },
);

onUnmounted(() => {
  resetCompressedPDF();
});

defineExpose({
  pdfFiles,
  addFiles,
});
</script>
