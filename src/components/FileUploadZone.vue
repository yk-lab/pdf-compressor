<template>
  <label
    :for="inputFileId"
    ref="dropZoneRef"
    class="block border-dashed border-2 border-gray-400 px-4 py-8 rounded cursor-pointer"
    :class="{ 'border-cyan-600': isOverDropZone }"
    aria-label="PDFファイルをアップロード"
  >
    <input
      type="file"
      :id="inputFileId"
      class="hidden"
      multiple
      @change="handleFiles"
      accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
    />
    <div class="text-cyan-600">
      <Upload class="size-8 mx-auto" aria-hidden="true" />
    </div>
    <div class="text-gray-600 text-center mt-4">
      PDFまたは画像ファイルをここに
      <em class="px-2 text-gray-900 bg-cyan-50">ドラッグ＆ドロップ</em>
      または
      <em class="px-2 text-gray-900 bg-cyan-50">クリック</em>
      して<template v-if="hasFiles">追加</template><template v-else>選択</template>してください。
    </div>
  </label>
</template>

<script setup lang="ts">
import { Upload } from 'lucide-vue-next';
import { useDropZone } from '@vueuse/core';
import { ref, useId } from 'vue';

interface Props {
  hasFiles?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'add-files': [files: File[]];
}>();

const inputFileId = useId();
const dropZoneRef = ref<HTMLLabelElement>();

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const handleFiles = async (event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) throw new TypeError();
  const files = event.target.files;
  if (files) {
    const filteredFiles = Array.from(files).filter((file) =>
      ALLOWED_FILE_TYPES.includes(file.type),
    );
    if (filteredFiles.length) {
      emit('add-files', filteredFiles);
    } else {
      console.warn('PDFまたは画像ファイルが含まれていません');
    }
  }
  event.target.value = '';
};

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files) => {
    if (!files || !files.length) return;
    const filteredFiles = files.filter((file) => ALLOWED_FILE_TYPES.includes(file.type));
    if (filteredFiles.length) {
      emit('add-files', filteredFiles);
    } else {
      console.warn('PDFまたは画像ファイルが含まれていません');
    }
  },
  dataTypes: ALLOWED_FILE_TYPES,
  multiple: true,
  preventDefaultForUnhandled: false,
});
</script>
