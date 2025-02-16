import { describe, it } from 'vitest';

import { mount } from '@vue/test-utils';
import SiteHeader from '../SiteHeader.vue';

describe('SiteHeader', () => {
  it('renders properly', () => {
    mount(SiteHeader, { props: {} });
  });
});
