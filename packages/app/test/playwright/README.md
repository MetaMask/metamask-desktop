# Desktop e2e tests

## Requirements

0. Have chrome installed.

1. Have generated a desktop app built with env param 
```
yarn app build:app:test:ui
```
2. Have generated a desktop UI 
```
yarn extension build:desktop:ui:ci
```
3. Have generated a MM extension built with env param 
```
yarn extension build:test:desktop:ui
```

## Run e2e
On `playwright` folder:
```
yarn test:e2e
```
