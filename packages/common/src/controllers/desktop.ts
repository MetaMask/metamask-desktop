import { DesktopController } from './desktop-base';

// eslint-disable-next-line import/no-mutable-exports
let controllerType: typeof DesktopController;

export const initDesktopController = (
  newControllerType: typeof DesktopController,
) => {
  if (controllerType) {
    return;
  }

  controllerType = newControllerType;
};

if (!(global as any).isDesktopApp) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  controllerType = require('./desktop-extension').ExtensionDesktopController;
}

export { controllerType as DesktopController };
