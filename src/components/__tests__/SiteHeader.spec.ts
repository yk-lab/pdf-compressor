import { describe, it, expect } from 'vitest';

import { mount } from '@vue/test-utils';
import SiteHeader from '../SiteHeader.vue';

describe('SiteHeader', () => {
  it('renders properly', () => {
    const wrapper = mount(SiteHeader, { props: {} });

    // コンポーネントが存在することを確認
    expect(wrapper.exists()).toBe(true);

    // タイトルが表示されていることを確認
    expect(wrapper.text()).toContain('PDF結合とファイルサイズ縮小');
  });
});
