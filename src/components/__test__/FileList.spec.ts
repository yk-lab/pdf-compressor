import { describe, it, expect } from 'vitest';

import { mount } from '@vue/test-utils';
import FileList from '@/components/FileList.vue';

describe('FileList', () => {
  it('renders properly', () => {
    const wrapper = mount(FileList, { props: {} });

    // コンポーネントが存在することを確認
    expect(wrapper.exists()).toBe(true);

    // 期待される内容が表示されていることを確認
    expect(wrapper.text()).toContain('ファイルを選択してください。');
  });

  it('renders file list', () => {
    const wrapper = mount(FileList, {
      props: {
        modelValue: [
          {
            id: '4da4d224-22b4-beae-349a-4b0df9a8e949',
            file: new File(['0'.repeat(10000)], 'file1.txt'),
          },
          { id: '4da4d224-22b4-beae-349a-4b0df9a8e950', file: new File([''], 'file2.txt') },
        ],
      },
    });

    // ファイルリストが表示されていることを確認
    expect(wrapper.text()).toContain('file1.txt (0.01 MB)');
    expect(wrapper.text()).toContain('file2.txt (0.00 MB)');
  });

  it('removes a file', async () => {
    const wrapper = mount(FileList, {
      props: {
        modelValue: [
          {
            id: '4da4d224-22b4-beae-349a-4b0df9a8e949',
            file: new File(['0'.repeat(10000)], 'file1.txt'),
          },
          { id: '4da4d224-22b4-beae-349a-4b0df9a8e950', file: new File([''], 'file2.txt') },
        ],
      },
    });

    await wrapper.find('[data-testid="remove-file"]').trigger('click');

    // update:modelValueイベントが発火されたことを確認
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    // イベントが1回だけ発火されたことを確認
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    // 発火されたイベントの値が正しいことを確認
    expect(wrapper.emitted('update:modelValue')).toMatchObject([
      [[{ id: '4da4d224-22b4-beae-349a-4b0df9a8e950', file: new File([''], 'file2.txt') }]],
    ]);

    // ファイルが削除されていることを確認
    expect(wrapper.text()).not.toContain('file1.txt (0.01 MB)');
  });
});
