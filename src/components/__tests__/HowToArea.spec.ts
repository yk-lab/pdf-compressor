import { describe, it } from 'vitest';

import { mount } from '@vue/test-utils';
import HowToArea from '../HowToArea.vue';

describe('HowToArea', () => {
  it('renders properly', () => {
    mount(HowToArea, { props: {} });
  });
});
