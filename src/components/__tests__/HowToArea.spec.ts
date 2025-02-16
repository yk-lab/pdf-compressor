import { describe, it } from 'vitest';

import { mount } from '@vue/test-utils';
import HowToArea from '../HowToArea.vue';

describe('HowToArea', () => {
  it('renders properly', () => {
    const wrapper = mount(HowToArea, { props: {} });
    
    // コンポーネントが存在することを確認
    expect(wrapper.exists()).toBe(true);
    
    // 期待される内容が表示されていることを確認
    expect(wrapper.text()).toContain('使い方');
  });
});
