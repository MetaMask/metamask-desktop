# Development

Several files which are needed for developing on MetaMask.

Usually each file or directory contains information about its scope / usage.

## Segment

### Debugging with the Mock Segment API

To start the [Mock Segment API](./mock-segment.js):

-   Add/replace the `SEGMENT_HOST` and `SEGMENT_WRITE_KEY` variables in `.metamaskrc`
    ```
    SEGMENT_HOST='http://localhost:9090'
    SEGMENT_WRITE_KEY='FAKE'
    ```
-   Build the project to the `./dist/` folder with `yarn dist`
-   Run the Mock Segment API from the command line
    ```
    node development/mock-segment.js
    ```

Events triggered whilst using the extension will be logged to the console of the Mock Segment API.

More information on the API and its usage can be found [here](./mock-segment.js#L28).

### Debugging in Segment

To debug in a production Segment environment:

- Create a free account on [Segment](https://segment.com/)
- Create a New Workspace
- Add a Source (Node.js)
- Copy the `Write Key` from the API Keys section under Settings
-   Add/replace the `SEGMENT_HOST` and `SEGMENT_WRITE_KEY` variables in `.metamaskrc`
    ```
    SEGMENT_HOST='https://api.segment.io'
    SEGMENT_WRITE_KEY='COPIED_WRITE_KEY'
    ```
-   Build the project to the `./dist/` folder with `yarn dist`

Events triggered whilst using the extension will be displayed in Segment's Debugger.

### Debugging Segment requests in MetaMask

To opt in to MetaMetrics;
- Unlock the extension
- Open the Account menu
- Click the `Settings` menu item
- Click the `Security & Privacy` menu item
- Toggle the `Participate in MetaMetrics` menu option to the `ON` position

You can inspect the requests in the `Network` tab of your browser's Developer Tools (background.html)
by filtering for `POST` requests to `/v1/batch`. The full url will be `http://localhost:9090/v1/batch`
or `https://api.segment.io/v1/batch` respectively.

## Sentry

### Debugging in Sentry

To debug in a production Sentry environment:

- If you have not already got a Sentry account, you can create a free account on [Sentry](https://sentry.io/)
- Create a New Sentry Organization
    - If you already have an existing Sentry account and workspace, open the sidebar drop down menu, then click `Switch organization` followed by `Create a new organization`
- Create a New Project
- Copy the `Public Key` and `Project ID` from the Client Keys section under your projects Settings
    - Select `Settings` in the sidebar menu, then select `Projects` in the secondary menu. Click your project then select `Client Keys (DSN)` from the secondary menu. Click the `Configure` button on the `Client Keys` page and copy your `Project Id` and `Public Key`
-   Add/replace the `SENTRY_DSN` and `SENTRY_DSN_DEV` variables in `.metamaskrc`
    ```
    SENTRY_DSN_DEV=https://{SENTRY_PUBLIC_KEY}@sentry.io/{SENTRY_PROJECT_ID}
    SENTRY_DSN=https://{SENTRY_PUBLIC_KEY}@sentry.io/{SENTRY_PROJECT_ID}
    ```
-   Build the project to the `./dist/` folder with `yarn dist`

Errors reported whilst using the extension will be displayed in Sentry's `Issues` page.
