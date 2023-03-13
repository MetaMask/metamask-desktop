# Release Process

## Electron Application

The MetaMask Desktop application can be packaged for Windows, Mac OS X, and Linux.

Official packaged releases for these three platforms are hosted on [GitHub](https://github.com/MetaMask/metamask-desktop/releases).

To create a new release:

1. Run `yarn release:app` then follow the instructions to specify which part of the version to update. After saving the file, it will automatically:

    - Increment the Electron application version defined in [packages/app/package/json](../packages/app/package.json).
    - Increment the root major version defined in [package.json](../package.json).
    - Update the Electron application changelog defined in [packages/app/CHANGELOG.md](../packages/app/CHANGELOG.md) using the commit messages since the last release.
    - Commit all the above in a new local branch with the name: `release/app-[NEW VERSION]`
    - Create a new local tag with the name: `metamask-desktop-app@[NEW VERSION]`

2. Push the branch and tag to the [metamask-desktop](https://github.com/MetaMask/metamask-desktop) repository.

3. Create a pull request with the release branch targetting the [app-stable](https://github.com/MetaMask/metamask-desktop/tree/app-stable) branch.

4. Once the pull request is reviewed, merge it using a merge commit. The GitHub workflow defined at [.github/workflows/package-app-prod.yml](../.github/workflows/package-app-prod.yml) will then automatically run if the commit message body starts with: `Release App [NEW VERSION]`.

5. Go to the [action on GitHub](https://github.com/MetaMask/metamask-desktop/actions/workflows/package-app-prod.yml) and approve the workflow, this will automatically:

    - Build and package the Electron application for all platforms.
    - Create a new draft release on GitHub with the packages as artifacts.

6. Publish the [draft release on GitHub](https://github.com/MetaMask/metamask-desktop/releases) to make it publicly visible and to create the associated tag: `v[NEW VERSION]`

7. Create a pull request to merge the release branch into the [main](https://github.com/MetaMask/metamask-desktop/tree/main) branch.

8. Once the pull request is reviewed, merge it using a merge commit.

## NPM Package

The `@metamask/desktop` package, also known as the common workspace, is a JavaScript library with releases hosted on [NPM](https://www.npmjs.com/package/@metamask/desktop).

To create a new release:

1. Run `yarn release:common` then follow the instructions to specify which part of the version to update. After saving the file, it will automatically:

    - Increment the common workspace version defined in [packages/common/package/json](../packages/common/package.json).
    - Increment the root major version defined in [package.json](../package.json).
    - Update the common workspace changelog defined in [packages/common/CHANGELOG.md](../packages/common/CHANGELOG.md) using the commit messages since the last release.
    - Commit all the above in a new local branch with the name: `release/common-[NEW VERSION]`

2. Push the branch to the [metamask-desktop](https://github.com/MetaMask/metamask-desktop) repository.

3. Create a pull request with the release branch targetting the [main](https://github.com/MetaMask/metamask-desktop/tree/main) branch.

4. Once the pull request is reviewed and merged, the GitHub workflow defined at [.github/workflows/publish-common-release.yml](../.github/workflows/publish-common-release.yml) will run. This will automatically:

    - Verify the commit message has the title: `Release Common [NEW VERSION]` before continuing.
    - Build the `@metamask/desktop` package.
    - Create a new public release on GitHub including the package files in a zipped artifact.
    - Create a tag with the name: `@metamask/desktop@[NEW VERSION]`
    - Perform a dry run to verify the package could be uploaded to NPM.

5. Go to the [action on GitHub](https://github.com/MetaMask/metamask-desktop/actions/workflows/publish-common-release.yml) and approve the workflow, this will cause the new package to be published to NPM.
