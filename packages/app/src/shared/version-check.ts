import { Duplex } from 'stream';
import log from 'loglevel';
import {
  VersionData,
  CheckVersionRequestMessage,
  CheckVersionResponseMessage,
} from '@metamask/desktop/dist/types';

import desktopAppCfg from '../utils/config';
import { getDesktopVersion } from '../utils/version';

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
      version: getDesktopVersion(),
      compatibilityVersion: desktopAppCfg().compatibilityVersion.desktop,
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
