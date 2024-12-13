import { describe, it, expect } from 'vitest';

import { mount } from '@vue/test-utils';
import MainArea from '../MainArea.vue';

describe('MainArea', () => {
  it('renders properly', () => {
    const wrapper = mount(MainArea, { props: {} });
    expect(wrapper.text()).toContain('PDFを結合・ファイルサイズ縮小');
  });
});
