import { describe, it } from 'vitest';

import { mount } from '@vue/test-utils';
import NotesArea from '../NotesArea.vue';

describe('NotesArea', () => {
  it('renders properly', () => {
    mount(NotesArea, { props: {} });
  });
});
