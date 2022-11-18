import { Duplex } from 'stream';
import log from 'loglevel';
import {
  cfg,
  waitForMessage,
  VersionCheckResult,
  VersionData,
  CheckVersionRequestMessage,
  CheckVersionResponseMessage,
} from '@metamask/desktop';
import { getVersion } from '../utils/version';

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)

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

    const desktopVersionData = {
      version: getVersion(),
      compatibilityVersion: cfg().desktop.compatibilityVersion.desktop,
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

export class ExtensionVersionCheck {
  private stream: Duplex;

  constructor(stream: Duplex) {
    this.stream = stream;
  }

  public async check(): Promise<VersionCheckResult> {
    log.debug('Checking versions');

    const extensionVersionData = {
      version: getVersion(),
      compatibilityVersion: cfg().desktop.compatibilityVersion.extension,
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
