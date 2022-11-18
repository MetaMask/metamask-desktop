# Desktop e2e tests

## Requirements

1. Have generated a desktop app built with env param 
```
SKIP_OTP_PAIRING_FLOW=1
```
1. Have generated a MM extension built with env param 
```
SKIP_OTP_PAIRING_FLOW=1
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
