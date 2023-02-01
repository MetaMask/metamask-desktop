# Desktop App E2E Tests

## Prerequisites

Install [Google Chrome](https://www.google.com/chrome/)

Install dependencies:

```
yarn setup
```

## Build Test Artifacts

```
yarn build:test:app
```

## Initialise Playwright

Install browsers to test with Playwright:

```
yarn app playwright install chromium
```

## Run Tests

```
yarn app test:e2e:app
```
