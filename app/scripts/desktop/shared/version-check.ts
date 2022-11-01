import { Duplex } from 'stream';
import log from 'loglevel';
import { VersionCheckResult, VersionData } from '../types/desktop';
import {
  CheckVersionRequestMessage,
  CheckVersionResponseMessage,
} from '../types/message';
import { waitForMessage } from '../utils/stream';
import { getVersion } from '../utils/version';

const checkIfOverridden = (hardcodedValue: number, envValue?: string) => {
  if (envValue) {
    return parseInt(envValue, 10);
  }

  return hardcodedValue;
};

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)

const COMPATIBILITY_VERSION_DESKTOP = 1;

export class DesktopVersionCheck {
  private stream: Duplex;

  constructor(stream: Duplex) {
    this.stream = stream;
  }

  public init() {
    this.stream.on('data', (data: CheckVersionRequestMessage) =>
      this.onMessage(data),
    );
  }

  private onMessage(data: CheckVersionRequestMessage) {
    log.debug('Received version request', data);

    const { extensionVersionData } = data;

    const desktopCompatibilityVersion = checkIfOverridden(
      COMPATIBILITY_VERSION_DESKTOP,
      process.env.COMPATIBILITY_VERSION_DESKTOP,
    );

    const desktopVersionData = {
      version: getVersion(),
      compatibilityVersion: desktopCompatibilityVersion,
    };

    const isExtensionSupported = this.isExtensionVersionSupported(
      extensionVersionData,
      desktopVersionData,
    );

    const checkVersionResponse: CheckVersionResponseMessage = {
      desktopVersionData,
      isExtensionSupported,
    };

    this.stream.write(checkVersionResponse);

    log.debug('Sent version', checkVersionResponse);
  }

  private isExtensionVersionSupported(
    extensionVersionData: VersionData,
    desktopVersionData: VersionData,
  ): boolean {
    return (
      extensionVersionData.compatibilityVersion >=
      desktopVersionData.compatibilityVersion
    );
  }
}
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(desktopextension)

const COMPATIBILITY_VERSION_EXTENSION = 1;

export class ExtensionVersionCheck {
  private stream: Duplex;

  constructor(stream: Duplex) {
    this.stream = stream;
  }

  public async check(): Promise<VersionCheckResult> {
    log.debug('Checking versions');

    const extensionCompatibilityVersion = checkIfOverridden(
      COMPATIBILITY_VERSION_EXTENSION,
      process.env.COMPATIBILITY_VERSION_EXTENSION,
    );

    const extensionVersionData = {
      version: getVersion(),
      compatibilityVersion: extensionCompatibilityVersion,
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
///: END:ONLY_INCLUDE_IN
