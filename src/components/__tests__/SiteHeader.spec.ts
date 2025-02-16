import { describe, it } from 'vitest';

import { mount } from '@vue/test-utils';
import SiteHeader from '../SiteHeader.vue';

describe('SiteHeader', () => {
  it('renders properly', () => {
    const wrapper = mount(SiteHeader, { props: {} });
    
    // コンポーネントが存在することを確認
    expect(wrapper.exists()).toBe(true);
    
    // サイトタイトルが表示されていることを確認
    expect(wrapper.find('.site-title').exists()).toBe(true);
    
    // ナビゲーションリンクの確認
    const navLinks = wrapper.findAll('nav a');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('handles responsive design', () => {
    const wrapper = mount(SiteHeader, {
      props: {},
      global: {
        mocks: {
          $viewport: {
            width: 375 // モバイル幅をシミュレート
          }
        }
      }
    });
    
    // モバイル表示の検証
    expect(wrapper.find('.mobile-menu').exists()).toBe(true);
  });
});
