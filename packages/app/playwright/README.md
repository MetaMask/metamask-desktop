# Desktop e2e tests


          name: Build desktop app for testing
          command: yarn build:desktop:app
      - run:
          name: Build desktop UI for testing
          command: yarn build:desktop:ui
      - run:
          name: Build extension for testing
          command: yarn build:test:desktop:ui   
      - run:
          name: Move test build to 'dist-test' to avoid conflict with production build
          command: mv ./dist ./dist-test-desktop 

## Requirements

1. Have generated a desktop app built with env param 
```
SKIP_OTP_PAIRING_FLOW=1 yarn build:desktop:app
```
2. Have generated a desktop UI 
```
yarn build:desktop:ui
```
3. Have generated a MM extension built with env param 
```
SKIP_OTP_PAIRING_FLOW=1 yarn build:test:desktop:ui
```

## Installation
On `playwright` folder:
```
yarn install
node node_modules/electron/install.js
npx playwright install chrome
```

## Run e2e
On `playwright` folder:
```
yarn desktop:e2e
```
