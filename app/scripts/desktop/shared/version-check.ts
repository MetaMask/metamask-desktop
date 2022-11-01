import { Duplex } from 'stream';
import log from 'loglevel';
import { VersionCheckResult } from '../types/desktop';
import { VersionMessage } from '../types/message';
import { waitForMessage } from '../utils/stream';
import { getVersion } from '../utils/version';

///: BEGIN:ONLY_INCLUDE_IN(desktopapp)
export class DesktopVersionCheck {
  private stream: Duplex;

  constructor(stream: Duplex) {
    this.stream = stream;
  }

  public init() {
    this.stream.on('data', (data: VersionMessage) => this.onMessage(data));
  }

  private onMessage(data: VersionMessage) {
    log.debug('Recieved version request', data);

    const isExtensionVersionValid = this.checkExtensionVersion(data.version);
    const desktopVersion = getVersion();

    const response: VersionMessage = {
      version: desktopVersion,
      isValid: isExtensionVersionValid,
    };

    this.stream.write(response);

    log.debug('Sent version', response);
  }

  private checkExtensionVersion(_: string): boolean {
    return true;
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

    const extensionVersion = getVersion();
    const message: VersionMessage = { version: extensionVersion };

    this.stream.write(message);

    const response = await waitForMessage<VersionMessage>(this.stream);
    const desktopVersion = response.version;

    const isExtensionVersionValid = response.isValid as boolean;
    const isDesktopVersionValid = this.checkDesktopVersion(desktopVersion);

    const result: VersionCheckResult = {
      extensionVersion,
      desktopVersion,
      isExtensionVersionValid,
      isDesktopVersionValid,
    };

    log.debug('Completed version check', result);

    return result;
  }

  private checkDesktopVersion(_: string): boolean {
    return true;
  }
}
///: END:ONLY_INCLUDE_IN
