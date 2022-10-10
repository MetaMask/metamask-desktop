# Playwright e2e - Not fully automated

This test is added to help debug the desktop / extension integration in its early stage. It aims to replicate the initial connection of the extension to desktop as it is been done manually until now.

### Steps to run:

1. Install dependencies
```
npm install
npx playwright install
```

2. Run ganache network with
```
ganache-cli --account '0x14b505cf14fd51f420eecad6b2da415742e172b6097150dd25b110654631822a,100000000000000000000'
```

3. Start desktop manually if is not started yet

4. Run test
```code
npx playwright test
```

