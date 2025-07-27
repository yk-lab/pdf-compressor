# PDF Compressor

[![RelativeCI](https://badges.relative-ci.com/badges/Wr6DyS3Q5rsIfqaI4SUv?branch=main&style=flat)](https://app.relative-ci.com/projects/Wr6DyS3Q5rsIfqaI4SUv)
[![codecov](https://codecov.io/gh/yk-lab/pdf-compressor/graph/badge.svg?token=XAMNwF4ZsW)](https://codecov.io/gh/yk-lab/pdf-compressor)
[![Maintainability](https://qlty.sh/badges/be1a615b-a505-4219-91f1-2fe87fe1a5b7/maintainability.svg)](https://qlty.sh/gh/yk-lab/projects/pdf-compressor)
[![Code Coverage](https://qlty.sh/gh/yk-lab/projects/pdf-compressor/coverage.svg)](https://qlty.sh/gh/yk-lab/projects/pdf-compressor)

高速でシンプルなブラウザベースのPDF圧縮・結合ツール。サーバーへのアップロード不要で、すべての処理がブラウザ内で完結します。

## 特徴

- 🚀 **完全にブラウザ内で動作** - ファイルのアップロード不要、プライバシー保護
- 🎯 **高速処理** - WebWorkerを活用した高速な圧縮処理
- 📄 **複数PDF対応** - 複数のPDFファイルを一つに結合
- 🎨 **品質調整** - JPEG品質を調整して最適なファイルサイズを実現
- 🔄 **ドラッグ&ドロップ** - 直感的なファイル操作
- 📱 **レスポンシブデザイン** - スマートフォンからデスクトップまで対応

## 技術スタック

- **フレームワーク**: Vue 3 (Composition API) + TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **PDFライブラリ**: pdf.js (読み込み), pdf-lib (作成・編集)
- **画像処理**: pica (高品質リサイズ)
- **テスト**: Vitest (単体テスト), Playwright (E2Eテスト)

## 使い方

1. [https://pdf-compressor.yk.works/](https://pdf-compressor.yk.works/) にアクセス
2. PDFファイルをドラッグ&ドロップ、またはクリックして選択
3. 圧縮品質を調整（0.1〜1.0）
4. 「圧縮」ボタンをクリック
5. 圧縮されたPDFをダウンロード

## 開発環境セットアップ

### 必要要件

- Node.js 22.13.x
- pnpm (パッケージマネージャー)

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
pnpm build

# Runs the end-to-end tests
pnpm test:e2e
# Runs the tests only on Chromium
pnpm test:e2e --project=chromium
# Runs the tests of a specific file
pnpm test:e2e tests/example.spec.ts
# Runs the tests in debug mode
pnpm test:e2e --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

### Format with Prettier

```sh
pnpm format
```

### Type Check

```sh
pnpm type-check
```

## プロジェクト構成

```plain
src/
├── components/
│   ├── MainArea.vue      # メインUIコンポーネント
│   └── FileList.vue      # ファイルリスト管理
├── utils/
│   └── pdf.ts           # PDF処理ロジック
│       ├── mergePdfFiles()              # PDF結合
│       ├── renderPdfToCanvases()        # PDF→Canvas変換
│       └── createCompressedPdfFromImages() # 圧縮処理
└── assets/              # 静的アセット
```

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容について議論してください。

## セキュリティ

このアプリケーションはすべての処理をブラウザ内で行うため、ファイルがサーバーに送信されることはありません。PDFファイルのプライバシーは完全に保護されます。
