# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 指示を受けた時…

作業中は適宜分報を行い、進捗や学び、気持ちを共有してください。
作業完了時は、必ず開発日誌を作成して報告してください。

ユーザーから今回限りではなく常に対応が必要だと思われる指示を受けた場合：

1. 「これを標準のルールにしますか？」と質問する
2. YESの場合は、CLAUDE.mdにそのルールを追加する
3. 以降はそのルールに従う

このプロセスにより、プロジェクトルールを継続的に改善します。

## User Communication Guidelines

**重要**: ユーザはミス、勘違い、判断誤りをよくするので、気づいたこと、気になったことは都度尋ねること。可能であれば始めにまとめて質問してくれるとより良い。

### 質問すべきタイミング

- 要件が曖昧または矛盾している場合
- 実装方法に複数の選択肢がある場合
- ユーザの意図が不明確な場合
- セキュリティやパフォーマンスに影響する決定が必要な場合
- 既存のコードとの整合性に疑問がある場合

### 効果的な質問方法

- **始めにまとめて質問**: 複数の確認事項がある場合は、作業開始前に一括で確認する
- **具体的な選択肢を提示**: 「AとBどちらが良いですか？」のように明確な選択肢を示す
- **影響範囲を説明**: 各選択肢の利点・欠点や影響を簡潔に説明する
- **推奨案を提示**: 技術的観点から推奨する方法を理由と共に提案する

## 開発日誌を作成すること

開発日誌を作成する際は、まず `date '+%Y-%m-%d_%H%M'` コマンドで現在の日本時間を取得し、`docs/dev_diary/yyyy-mm-dd_hhmm.md` の形式でファイルを作成してください。

**日付**: yyyy-mm-dd hh:mm（`date '+%Y-%m-%d %H:%M'` で取得した日本時間を記載）

**作業内容**:

- 実装した機能や修正内容
- 発見したバグや問題点
- どのように解決したか

**次回の予定**:

- 次回実施する作業内容

**感想**: 開発の進捗や学び、改善点など

**気分**: なんかいい感じのことを書く

**愚痴**: なんかいい感じのことを書く

愚痴の欄はユーザは確認しないので、自由に書いてください。

## 分報

気になったこと、学んだことなどを分報として send_to_slack ツールを使って呟いてください。
活発に分報を行うことで、チームのコミュニケーションが活性化し、開発効率が向上します。

## 開発TODOリストの管理

開発作業を進める際は、TodoWrite/TodoReadツールを使用してTODOリストを作成・管理してください。

### TODOリスト管理の原則

1. **常にTODOリストを確認**: 作業開始時、作業中、作業終了時にTodoReadで確認
2. **即座に更新**: タスクの状態が変わったらすぐにTodoWriteで更新
3. **適切な粒度**: タスクは具体的で実行可能な単位に分割
4. **優先度設定**: high/medium/lowで優先度を設定
5. **進捗の可視化**: in_progressは常に1つのみ

### タスクのライフサイクル

1. `pending`: 未着手のタスク
2. `in_progress`: 現在作業中（同時に1つのみ）
3. `completed`: 完了したタスク

### 分報のタイミング

- 論理的な機能単位が完成したとき
- 大きな変更を加えた後
- テストが通った後
- 作業を中断する前

### 自律的な開発フロー

1. TodoReadでタスクを確認
2. 優先度の高いタスクを選択
3. タスクをin_progressに更新
4. 実装作業を実施
5. テスト実行（可能な場合）
6. タスクをcompletedに更新
7. 開発日誌を更新
8. 適切なタイミングでgit commit & push
9. 定期的にコードのリファクタリングを検討
   - 重複コードの削除
   - コンポーネントの適切な分割
   - 型定義の改善
   - パフォーマンスの最適化
10. 次のタスクへ

自律開発モード中は、ユーザへの指示を待たずに、TodoReadでタスクを確認し、優先度の高いものから順に進めてください。タスクが完了したら、TodoWriteで更新し、開発日誌も忘れずに記録してください。
適宜分報を行い、進捗や学びを共有してください。この指針に従って、自律的に開発を進めてください。

### リファクタリングのタイミング

- 3-5個のタスクを完了した後
- 同じパターンのコードが3箇所以上ある場合
- コンポーネントが100行を超えた場合
- 新機能追加前の準備として

この指針に従って、自律的に開発を進めてください。

## Commands

### Development

- `pnpm dev` - Start development server with hot reload (<http://localhost:5173>)
- `pnpm build` - Type-check and build for production (runs both type-check and build-only in parallel)
- `pnpm build-only` - Build without type checking
- `pnpm preview` - Preview production build (<http://localhost:4173>)

### Testing

- `pnpm test` - Run all tests (unit and e2e) sequentially
- `pnpm test:unit` - Run unit tests with coverage (uses Vitest)
- `pnpm test:e2e` - Run end-to-end tests with Playwright
- `pnpm test-dev` - Run unit tests in watch mode for development

### Code Quality

- `pnpm lint` - Run all linters sequentially (oxlint then eslint)
  - `pnpm lint:oxlint` - Run oxlint with auto-fix (focuses on correctness)
  - `pnpm lint:eslint` - Run eslint with auto-fix
- `pnpm format` - Format code with Prettier (targets src/ directory)
- `pnpm type-check` - Run TypeScript type checking with vue-tsc

### Git Hooks

Managed by lefthook (automatically installed with `pnpm prepare`):

- **pre-commit**: Runs lint, cspell, tests, and prevents commits to main branch
- **pre-push**: Runs pnpm audit for security checks
- **commit-msg**: Spell checks commit messages

## Architecture Overview

This is a Vue 3 + TypeScript web application for compressing and merging PDF files directly in the browser.
All processing happens client-side without server uploads.

### Frontend Stack

- **Vue 3** with Composition API and `<script setup>` syntax
- **TypeScript** for type safety
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling
- **Vitest** for unit testing
- **Playwright** for e2e testing (Chromium, Firefox, WebKit)

### Core Libraries

- **pdf.js** (pdfjs-dist) - For reading and rendering PDF files
- **pdf-lib** - For creating and manipulating PDF documents
- **pica** - For high-quality image resizing
- **@vueuse/core** - Vue composables library (used for drag-and-drop functionality)
- **sortablejs** - For drag-and-drop file reordering

### Key Components

- `MainArea.vue` - Main UI component handling file uploads, drag-and-drop, and PDF processing
- `FileList.vue` - Manages the list of uploaded PDF files with drag-and-drop reordering
- `HowToArea.vue` - Instructions for users
- `NotesArea.vue` - Important notes about the application
- `SiteHeader.vue` - Application header

### PDF Processing Logic (`utils/pdf.ts`)

- `mergePdfFiles()` - Merges multiple PDFs into one using pdf-lib
- `renderPdfToCanvases()` - Renders PDF pages to HTML canvases using pdf.js
- `createCompressedPdfFromImages()` - Compresses PDFs by:
  - Converting pages to JPEG images with adjustable quality
  - Using pica for high-quality image resizing
  - Embedding images into a new PDF with size constraints
  - Throws `PDFCompressionSizeError` if target size can't be achieved

### Processing Flow

1. User uploads/drags PDF files into drop zone
2. Files are validated (must be PDF type)
3. Files can be reordered via drag-and-drop
4. On compression:
   - Multiple PDFs are merged using pdf-lib
   - Merged PDF is rendered to canvases using pdf.js
   - Canvases are converted to JPEG images with specified quality
   - Images are resized using pica if needed
   - New PDF is created with compressed images
   - Download link is generated with timestamp filename

### Testing Setup

- **Unit Tests**: Vitest with jsdom environment
  - Coverage reporting in multiple formats
  - Mock setup for canvas operations (`vitest-canvas-mock`)
  - Test files located alongside source files (`*.test.ts`, `*.spec.ts`)
- **E2E Tests**: Playwright testing across browsers
  - Uses dev server locally, preview server in CI
  - Headless mode in CI, headed locally

### Important Configuration

- Uses `pnpm` as package manager (enforced via preinstall script)
- Node.js version 22.13.x required
- Git hooks via lefthook for pre-commit checks:
  - Linting (oxlint + eslint)
  - Spell checking (cspell)
  - Test execution
  - Branch protection (prevents direct commits to main)
- Path alias: `@` maps to `src/` directory
- PDF.js CMaps are copied to assets during build

## Development Tips

### Testing Guidelines

#### テストコード作成時の注意事項

- **こまめな実行**: テストコードは小さな単位で作成し、都度実行して動作確認する
- **モックの適切な実装**: グローバルオブジェクトをモックする際は、元の実装を保存してテスト後に復元する
- **カバレッジ目標**: patch coverageで80%以上を目指す
- **エラーケースの網羅**: 成功パターンだけでなく、エラーパターンも必ずテストする

#### よくあるモックパターン

```typescript
// Image オブジェクトのモック例
const originalImage = global.Image;
global.Image = vi.fn().mockImplementation(() => {
  const img: any = { width: 200, height: 150 };
  Object.defineProperty(img, 'onload', {
    set: (handler: () => void) => {
      setTimeout(() => handler(), 0);
    },
  });
  return img;
}) as unknown as typeof Image;
// テスト後: global.Image = originalImage;

// createElement のモック例（再帰を避ける）
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tag: any) => {
  if (tag === 'canvas') {
    return mockCanvas as unknown as HTMLCanvasElement;
  }
  return originalCreateElement(tag);
});
```

### Running Single Tests

- **Unit test**: `pnpm test-dev -- <test-file-name>` (e.g., `pnpm test-dev -- pdf.test`)
- **E2E test**: `pnpm test:e2e -- <test-file-path>` (e.g., `pnpm test:e2e -- e2e/vue.spec.ts`)
- **Specific test pattern**: Use `-t` flag with test name pattern
- **Coverage確認**: `pnpm test:unit` でカバレッジレポートを確認

### Key Development Workflows

1. **Adding a new feature**:
   - Create/modify Vue components in `src/components/`
   - Add utility functions in `src/utils/`
   - Write unit tests alongside source files
   - Update E2E tests if UI changes

2. **Debugging PDF processing**:
   - Check browser console for pdf.js errors
   - Use `PDFCompressionSizeError` for size-related issues
   - Monitor canvas rendering in DevTools

3. **Before committing**:
   - Run `pnpm lint` to fix linting issues
   - Run `pnpm format` to format code
   - Run `pnpm test` to ensure all tests pass
   - Lefthook will automatically run checks

### Common Issues

- **PDF.js worker errors**: Ensure worker files are properly loaded (check vite config)
- **Canvas errors in tests**: vitest-canvas-mock should handle this automatically
- **Large PDF handling**: Consider memory usage when processing multiple large files
