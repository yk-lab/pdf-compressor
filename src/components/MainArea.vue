<template>
  <div>
    <label
      ref="dropZoneRef"
      class="block border-dashed border-2 border-gray-400 px-4 py-8 rounded cursor-pointer"
      :class="{ 'border-cyan-600': isOverDropZone }"
    >
      <input type="file" class="hidden" multiple @change="handleFiles" accept=".pdf" />
      <div class="text-cyan-600">
        <Upload class="size-8 mx-auto" aria-hidden="true" />
      </div>
      <div class="text-gray-600 text-center mt-4">
        PDFファイルをここに
        <em class="px-2 text-gray-900 bg-cyan-50">ドラッグ＆ドロップ</em>
        または
        <em class="px-2 text-gray-900 bg-cyan-50">クリック</em>
        して<template v-if="pdfFiles.length > 0">追加</template
        ><template v-else>選択</template>してください。
      </div>
    </label>

    <FileList class="mt-4" v-model="pdfFiles" />

    <button
      class="block w-full text-sm text-white bg-cyan-600 hover:bg-cyan-500 py-2 px-4 rounded font-semibold mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
import { Upload } from 'lucide-vue-next';
import { computed, ref, watch, onUnmounted } from 'vue';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { getGeneratedPDFOutputFileName } from '@/utils/file';
import { mergePdfFiles, renderPdfToCanvases, createCompressedPdfFromImages } from '@/utils/pdf';
import FileList from './FileList.vue';
import { useDropZone } from '@vueuse/core';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const dropZoneRef = ref<HTMLDivElement>();
const pdfFiles = ref<{ id: string; file: File }[]>([]); // 選択されたPDFファイル
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

const addFiles = (files: File[]) => {
  const filteredFiles = files.filter((file) => file.type === 'application/pdf');
  pdfFiles.value.push(...filteredFiles.map((file) => ({ id: crypto.randomUUID(), file })));
  resetCompressedPDF();
};

const handleFiles = async (event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) throw new TypeError();
  const files = event.target.files;
  if (files) {
    addFiles(Array.from(files));
  }
  event.target.value = '';
};

const onDrop = (files: File[] | null) => {
  if (files) {
    addFiles(files);
  }
};

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  // specify the types of data to be received.
  dataTypes: ['application/pdf'],
  // control multi-file drop
  multiple: true,
  // whether to prevent default behavior for unhandled events
  preventDefaultForUnhandled: false,
});

// メイン処理例
async function handlePdfFiles(files: File[]) {
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

const mergeAndCompressPDF = () => {
  handlePdfFiles(pdfFiles.value.map((f) => f.file));
};

const filesizeDisplay = computed(() => filesize(fileSize.value));

watch(pdfFiles, () => {
  resetCompressedPDF();
});

onUnmounted(() => {
  resetCompressedPDF();
});
</script>
