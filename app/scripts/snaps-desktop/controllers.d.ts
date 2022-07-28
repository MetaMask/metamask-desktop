import { AppKeyType } from '@metamask/snap-controllers';
export interface GetAppKeyAction {
    type: `MetaMaskController:getAppKey`;
    handler: (subject: string, appKeyType: AppKeyType) => string;
}
export interface CloseAllConnectionsAction {
    type: `MetaMaskController:closeAllConnections`;
    handler: (origin: string) => void;
}
