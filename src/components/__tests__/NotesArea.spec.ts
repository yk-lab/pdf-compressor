import { describe, it } from 'vitest';

import { mount } from '@vue/test-utils';
import NotesArea from '../NotesArea.vue';

describe('NotesArea', () => {
  it('renders properly', () => {
    const wrapper = mount(NotesArea, { props: {} });
    
    // コンポーネントが存在することを確認
    expect(wrapper.exists()).toBe(true);
    
    // 注意事項が表示されていることを確認
    expect(wrapper.text()).toContain('注意事項');
  });
});
