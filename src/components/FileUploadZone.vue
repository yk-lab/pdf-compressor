<template>
  <div>
    <label
      :for="inputFileId"
      ref="dropZoneRef"
      class="block border-dashed border-2 border-gray-400 px-4 py-8 rounded cursor-pointer"
      :class="{ 'border-cyan-600': isOverDropZone }"
      aria-label="PDFまたは画像ファイルをアップロード"
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

    <!-- エラーメッセージ表示エリア -->
    <Transition name="error-fade">
      <div
        v-if="errorMessage"
        class="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
        role="alert"
        aria-live="polite"
      >
        <div class="flex items-start">
          <svg class="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="font-semibold">{{ errorMessage }}</p>
            <p class="mt-1">対応ファイル形式: PDF, JPEG, PNG, WebP, GIF</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { Upload } from 'lucide-vue-next';
import { useDropZone } from '@vueuse/core';
import { ref, useId, onUnmounted } from 'vue';

interface Props {
  hasFiles?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'add-files': [files: File[]];
}>();

const inputFileId = useId();
const dropZoneRef = ref<HTMLLabelElement>();
const errorMessage = ref<string>('');
let errorTimer: ReturnType<typeof setTimeout> | null = null;

// エラーメッセージを一定時間後に自動で消す
const showError = (message: string) => {
  // 既存のタイマーがあればクリア
  if (errorTimer) {
    clearTimeout(errorTimer);
    errorTimer = null;
  }

  errorMessage.value = message;

  // 新しいタイマーを設定
  errorTimer = setTimeout(() => {
    errorMessage.value = '';
    errorTimer = null;
  }, 5000); // 5秒後に消える
};

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// ファイル検証の共通処理
const processFiles = (files: File[] | null) => {
  if (!files || files.length === 0) return;

  // ファイルサイズチェック
  const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
  if (oversizedFiles.length > 0) {
    const oversizedNames = oversizedFiles.map((f) => f.name).join(', ');
    showError(`ファイルサイズが大きすぎます (最大100MB): ${oversizedNames}`);
    return;
  }

  const validFiles = files.filter((file) => ALLOWED_FILE_TYPES.includes(file.type));
  const invalidFiles = files.filter((file) => !ALLOWED_FILE_TYPES.includes(file.type));

  if (validFiles.length > 0) {
    emit('add-files', validFiles);
    errorMessage.value = ''; // エラーをクリア
  }

  if (invalidFiles.length > 0) {
    const invalidTypes = [
      ...new Set(
        invalidFiles.map((f) => {
          const ext = f.name.split('.').pop()?.toUpperCase() || '';
          return ext || f.type || '不明な形式';
        }),
      ),
    ].join(', ');
    showError(`サポートされていないファイル形式: ${invalidTypes}`);
  }
};

const handleFiles = async (event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) throw new TypeError();
  const files = event.target.files;
  if (files) {
    processFiles(Array.from(files));
  }
  event.target.value = '';
};

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: processFiles,
  // dataTypesを削除して全てのファイルを受け入れ、processFiles内でフィルタリング
  multiple: true,
  preventDefaultForUnhandled: true,
});

// クリーンアップ: コンポーネントがアンマウントされる時にタイマーをクリア
onUnmounted(() => {
  if (errorTimer) {
    clearTimeout(errorTimer);
    errorTimer = null;
  }
});
</script>

<style scoped>
/* エラーメッセージのフェードアニメーション */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.error-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
