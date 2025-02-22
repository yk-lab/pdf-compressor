<template>
  <div>
    <ol class="text-gray-600 space-y-2" aria-label="File list" ref="el">
      <li
        v-for="{ file, id } in files"
        :key="id"
        class="flex space-x-4 border rounded-md p-2 items-center justify-between select-none"
      >
        <div class="flex items-center space-x-4">
          <GripVertical class="handle cursor-ns-resize" role="img" aria-label="Drag file" />
          <img v-if="file.type === 'application/pdf'" :src="pdfIcon" class="size-8" />
          {{ file.name }}
          <span class="text-sm">({{ filesize(file.size) }})</span>
        </div>
        <button @click="removeFile(id)" class="text-red-500 ml-4" aria-label="Remove file">
          <Delete class="size-6" role="img" />
          <span class="sr-only"> Remove</span>
        </button>
      </li>
    </ol>
    <p v-if="files.length === 0" class="text-gray-500" aria-hidden="true">
      ファイルを選択してください。<br />複数選択可能です。
    </p>
  </div>
</template>

<script lang="ts" setup>
import { useSortable } from '@vueuse/integrations/useSortable';
import { Delete } from 'lucide-vue-next';
import { GripVertical } from 'lucide-vue-next';
import pdfIcon from '@/assets/icons/pdf.svg?url';
import { useTemplateRef, computed } from 'vue';

const el = useTemplateRef<HTMLElement>('el');
const files = defineModel<{ id: string; file: File }[]>({
  type: Array,
  default: [],
});
useSortable(el, files, {
  handle: '.handle',
  animation: 200,
  ghostClass: 'ghost',
});

const filesize = computed(() => (size: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'unit',
    unit: 'megabyte',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(size / 1024 / 1024);
});

const removeFile = (id: string) => {
  files.value = files.value.filter((f) => f.id !== id);
};
</script>

<style scoped lang="postcss">
.ghost {
  @apply bg-gray-100 opacity-50;
}
</style>
