import desktopManager from '../desktop-manager';
import { Pairing } from '../pairing';

const generateOTP = () => Pairing.generateOTP();
const testConnection = () => desktopManager.testConnection();

export const extensionLogic = {
  generateOTP,
  testConnection,
};
