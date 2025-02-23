# pdf-compressor

[![RelativeCI](https://badges.relative-ci.com/badges/Wr6DyS3Q5rsIfqaI4SUv?branch=main&style=flat)](https://app.relative-ci.com/projects/Wr6DyS3Q5rsIfqaI4SUv)
[![codecov](https://codecov.io/gh/yk-lab/pdf-compressor/graph/badge.svg?token=XAMNwF4ZsW)](https://codecov.io/gh/yk-lab/pdf-compressor)
[![Maintainability](https://api.codeclimate.com/v1/badges/869e894e25db706ca9a5/maintainability)](https://codeclimate.com/github/yk-lab/pdf-compressor/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/869e894e25db706ca9a5/test_coverage)](https://codeclimate.com/github/yk-lab/pdf-compressor/test_coverage)
[![Maintainability](https://qlty.sh/badges/be1a615b-a505-4219-91f1-2fe87fe1a5b7/maintainability.svg)](https://qlty.sh/gh/yk-lab/projects/pdf-compressor)

## Recommended IDE Setup

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
