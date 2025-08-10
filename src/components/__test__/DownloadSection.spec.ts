import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DownloadSection from '../DownloadSection.vue';

describe('DownloadSection', () => {
  it('does not render when downloadUrl is null', () => {
    const wrapper = mount(DownloadSection, {
      props: {
        downloadUrl: null,
        fileName: 'test.pdf',
        size: 1024,
      },
    });
    expect(wrapper.find('a').exists()).toBe(false);
    // v-ifがfalseの場合、divが表示されないことを確認
    expect(wrapper.find('div.mt-4').exists()).toBe(false);
  });

  it('renders download link when downloadUrl is provided', () => {
    const wrapper = mount(DownloadSection, {
      props: {
        downloadUrl: 'https://example.com/file.pdf',
        fileName: 'test.pdf',
        size: 1024,
      },
    });

    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://example.com/file.pdf');
    expect(link.attributes('download')).toBe('test.pdf');
  });

  it('displays correct download text and file size', () => {
    const wrapper = mount(DownloadSection, {
      props: {
        downloadUrl: 'https://example.com/file.pdf',
        fileName: 'test.pdf',
        size: 1048576, // 1MB
      },
    });

    expect(wrapper.text()).toContain('PDFをダウンロード');
    expect(wrapper.text()).toContain('1.0 Mb'); // filesize.js formats 1MB like this
    expect(wrapper.text()).toContain('※ファイルサイズは目安です');
  });

  it('has correct styling classes', () => {
    const wrapper = mount(DownloadSection, {
      props: {
        downloadUrl: 'https://example.com/file.pdf',
        fileName: 'test.pdf',
        size: 1024,
      },
    });

    const link = wrapper.find('a');
    expect(link.classes()).toContain('text-cyan-600');
    expect(link.classes()).toContain('underline');
    expect(link.classes()).toContain('hover:text-cyan-500');
    expect(link.classes()).toContain('text-lg');
    expect(link.classes()).toContain('font-semibold');
  });

  it('handles different file sizes correctly', () => {
    const testCases = [
      { size: 512, expected: '512.0 b' },
      { size: 1024, expected: '1.0 Kb' },
      { size: 1048576, expected: '1.0 Mb' },
      { size: 524288, expected: '512.0 Kb' },
    ];

    testCases.forEach(({ size, expected }) => {
      const wrapper = mount(DownloadSection, {
        props: {
          downloadUrl: 'https://example.com/file.pdf',
          fileName: 'test.pdf',
          size,
        },
      });
      expect(wrapper.text()).toContain(expected);
    });
  });

  it('renders warning message about file size', () => {
    const wrapper = mount(DownloadSection, {
      props: {
        downloadUrl: 'https://example.com/file.pdf',
        fileName: 'test.pdf',
        size: 1024,
      },
    });

    const warning = wrapper.find('p.text-sm.text-gray-500');
    expect(warning.exists()).toBe(true);
    expect(warning.text()).toContain(
      '※ファイルサイズは目安です。実際のファイルサイズはブラウザによって異なります。',
    );
  });

  it('wraps content in a div with mt-4 class', () => {
    const wrapper = mount(DownloadSection, {
      props: {
        downloadUrl: 'https://example.com/file.pdf',
        fileName: 'test.pdf',
        size: 1024,
      },
    });

    const container = wrapper.find('div');
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain('mt-4');
  });
});
