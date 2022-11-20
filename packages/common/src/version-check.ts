import { Duplex } from 'stream';
import log from 'loglevel';
import {
  CheckVersionRequestMessage,
  CheckVersionResponseMessage,
  VersionCheckResult,
  VersionData,
} from './types';
import { cfg } from './utils/config';
import { waitForMessage } from './utils/stream';

export class VersionCheck {
  private stream: Duplex;

  private getVersion: () => string;

  constructor(stream: Duplex, getVersion: () => string) {
    this.stream = stream;
    this.getVersion = getVersion;
  }

  public async check(): Promise<VersionCheckResult> {
    log.debug('Checking versions');

    const extensionVersionData = {
      version: this.getVersion(),
      compatibilityVersion: cfg().compatibilityVersion.extension,
    };

    const checkVersionRequest: CheckVersionRequestMessage = {
      extensionVersionData,
    };

    this.stream.write(checkVersionRequest);

    const response = await waitForMessage<CheckVersionResponseMessage>(
      this.stream,
    );

    const isExtensionVersionValid = response.isExtensionSupported;

    const isDesktopVersionValid = this.isDesktopVersionSupported(
      response.desktopVersionData,
      extensionVersionData,
    );

    const extensionVersion = extensionVersionData.version;
    const desktopVersion = response.desktopVersionData.version;

    const result: VersionCheckResult = {
      extensionVersion,
      desktopVersion,
      isExtensionVersionValid,
      isDesktopVersionValid,
    };

    log.debug('Completed version check', result);

    return result;
  }

  private isDesktopVersionSupported(
    desktopVersionData: VersionData,
    extensionVersionData: VersionData,
  ): boolean {
    return (
      desktopVersionData.compatibilityVersion >=
      extensionVersionData.compatibilityVersion
    );
  }
}
