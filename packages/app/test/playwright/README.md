# Desktop App E2E Tests

## Setup

### Preconditions:
1. Install Google Chrome

2. Have deps installed
```
yarn setup
```

### Build testing artifacts
2. Build the desktop app
```
yarn build:test:app
```

### Initialise playwright in case is your first time
3. Initialise Playwright
```
yarn app playwright install
```

4. Specify the following environment variables in the CLI or in a [.env](../../.env.example) file

| Name | Description
| --- | --- |
| `ELECTRON_APP_PATH` | Path to the transpiled Electron app being tested
| `ELECTRON_CONFIG_PATH` | Path to the Electron system folder where config files are persisted
| `MMD_PASSWORD` | Password used to secure the extension within the tests
| `SEED_PHRASE` | Seed phrase used to generate predictable wallet addresses within the tests

## Run
```
yarn app test:e2e:app
```
