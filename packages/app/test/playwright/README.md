# Desktop App E2E Tests

## Setup

1. Install Google Chrome

2. Build the desktop app
```
yarn app build:app:test:ui
```

3. Build the desktop app UI 
```
yarn extension build:desktop:ui:ci
```

4. Build the extension
```
yarn extension build:test:desktop:ui
```

5. Initialise Playwright
```
yarn app playwright install
```

6. Specify the following environment variables in the CLI or in a [.env](../../.env.example) file

| Name | Description
| --- | --- |
| `ELECTRON_APP_PATH` | Path to the transpiled Electron app being tested
| `MMD_PASSWORD` | Password used to secure the extension within the tests
| `SEED_PHRASE` | Seed phrase used to generate predictable wallet addresses within the tests

## Run
```
yarn app test:e2e
```
