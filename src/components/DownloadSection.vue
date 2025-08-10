<template>
  <div v-if="downloadUrl" class="mt-4">
    <a
      :href="downloadUrl"
      :download="fileName"
      class="text-cyan-600 underline hover:text-cyan-500 mt-4 hover:underline text-lg font-semibold"
    >
      PDFをダウンロード
      <span class="text-base font-medium"> ({{ filesize(size) }}) </span>
    </a>
    <p class="text-sm text-gray-500">
      ※ファイルサイズは目安です。実際のファイルサイズはブラウザによって異なります。
    </p>
  </div>
</template>

<script setup lang="ts">
import filesize from 'filesize.js';

interface Props {
  downloadUrl: string | null;
  fileName: string;
  size: number;
}

defineProps<Props>();
</script>