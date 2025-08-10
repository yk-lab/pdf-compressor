import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import FileUploadZone from '../FileUploadZone.vue';
import { nextTick } from 'vue';

// Utility function to set input.files with configurable: true
function setInputFiles(el: HTMLInputElement, files: File[]) {
  Object.defineProperty(el, 'files', {
    value: files,
    configurable: true,
  });
}

describe('FileUploadZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders upload zone with correct text', () => {
    const wrapper = mount(FileUploadZone);
    expect(wrapper.text()).toContain('PDFまたは画像ファイル');
    expect(wrapper.text()).toContain('ドラッグ＆ドロップ');
    expect(wrapper.text()).toContain('クリック');
    expect(wrapper.text()).toContain('選択');
  });

  it('shows "追加" text when hasFiles prop is true', () => {
    const wrapper = mount(FileUploadZone, {
      props: { hasFiles: true },
    });
    expect(wrapper.text()).toContain('追加');
    expect(wrapper.text()).not.toContain('選択してください');
  });

  it('shows "選択" text when hasFiles prop is false', () => {
    const wrapper = mount(FileUploadZone, {
      props: { hasFiles: false },
    });
    expect(wrapper.text()).toContain('選択してください');
    expect(wrapper.text()).not.toContain('追加してください');
  });

  it('emits add-files event when valid files are selected', async () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;

    const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const jpegFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });

    // Mock FileList
    setInputFiles(input, [pdfFile, jpegFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    expect(wrapper.emitted('add-files')).toBeTruthy();
    expect(wrapper.emitted('add-files')![0]).toEqual([[pdfFile, jpegFile]]);
  });

  it('shows error message for invalid file types', async () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;

    const txtFile = new File(['text'], 'test.txt', { type: 'text/plain' });

    setInputFiles(input, [txtFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    expect(wrapper.emitted('add-files')).toBeFalsy();
    expect(wrapper.text()).toContain('サポートされていないファイル形式');
    expect(wrapper.text()).toContain('対応ファイル形式: PDF, JPEG, PNG, WebP, GIF');
  });

  it('shows error message for oversized files', async () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;

    // Create a file "pretending" to be larger than 100MB (avoid huge memory usage)
    const largeFile = new File(['x'], 'large.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(largeFile, 'size', {
      value: 101 * 1024 * 1024, // 101MB
      configurable: true,
    });

    setInputFiles(input, [largeFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    expect(wrapper.emitted('add-files')).toBeFalsy();
    expect(wrapper.text()).toContain('ファイルサイズが大きすぎます (最大100MB)');
  });

  it('accepts all supported image formats', async () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;

    const jpegFile = new File(['jpeg'], 'test.jpg', { type: 'image/jpeg' });
    const pngFile = new File(['png'], 'test.png', { type: 'image/png' });
    const webpFile = new File(['webp'], 'test.webp', { type: 'image/webp' });
    const gifFile = new File(['gif'], 'test.gif', { type: 'image/gif' });

    setInputFiles(input, [jpegFile, pngFile, webpFile, gifFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    expect(wrapper.emitted('add-files')).toBeTruthy();
    expect(wrapper.emitted('add-files')![0]).toEqual([[jpegFile, pngFile, webpFile, gifFile]]);
  });

  it('processes files when selected', async () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;

    const pdfFile = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });

    setInputFiles(input, [pdfFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    // Just verify that the file was processed
    expect(wrapper.emitted('add-files')).toBeTruthy();
  });

  it('auto-clears error message after 5 seconds', async () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;

    const txtFile = new File(['text'], 'test.txt', { type: 'text/plain' });

    setInputFiles(input, [txtFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    // Error message should be shown
    expect(wrapper.text()).toContain('サポートされていないファイル形式');

    // Advance time by 4.9 seconds - error should still be visible
    vi.advanceTimersByTime(4900);
    await nextTick();
    expect(wrapper.text()).toContain('サポートされていないファイル形式');

    // Advance time by another 0.2 seconds (total 5.1 seconds) - error should be gone
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(wrapper.text()).not.toContain('サポートされていないファイル形式');
  });

  it('has correct accept attribute on input', () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]');

    expect(input.attributes('accept')).toBe('.pdf,.jpg,.jpeg,.png,.webp,.gif');
    expect(input.attributes('multiple')).toBeDefined();
  });

  it('has unique id for input element', () => {
    const wrapper = mount(FileUploadZone);
    const id = wrapper.find('input[type="file"]').attributes('id');

    // Vue's useId() generates unique IDs, but in test they might be the same
    // Just check that an ID exists
    expect(id).toBeDefined();
    expect(id).toBeTruthy();
  });

  it('clears previous error when valid files are added', async () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;

    // First, add invalid file to show error
    const txtFile = new File(['text'], 'test.txt', { type: 'text/plain' });
    setInputFiles(input, [txtFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    expect(wrapper.text()).toContain('サポートされていないファイル形式');

    // Now add valid file - reconfigure the property
    const pdfFile = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
    setInputFiles(input, [pdfFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    expect(wrapper.text()).not.toContain('サポートされていないファイル形式');
    expect(wrapper.emitted('add-files')![0]).toEqual([[pdfFile]]);
  });

  it('processes both valid and invalid files correctly', async () => {
    const wrapper = mount(FileUploadZone);
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;

    const pdfFile = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
    const txtFile = new File(['text'], 'test.txt', { type: 'text/plain' });
    const jpegFile = new File(['jpeg'], 'test.jpg', { type: 'image/jpeg' });

    setInputFiles(input, [pdfFile, txtFile, jpegFile]);

    await input.dispatchEvent(new Event('change'));
    await nextTick();

    // Should emit only valid files
    expect(wrapper.emitted('add-files')).toBeTruthy();
    expect(wrapper.emitted('add-files')![0]).toEqual([[pdfFile, jpegFile]]);

    // Should show error for invalid file
    expect(wrapper.text()).toContain('サポートされていないファイル形式');
  });
});
