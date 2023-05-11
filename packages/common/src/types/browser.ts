export interface Browser {
  storage: {
    local: {
      get: () => Promise<any>;
      set: (data: any) => Promise<void>;
      clear: () => Promise<void>;
    };
  };
  runtime: {
    id: string;
    protocol: string;
    reload: () => undefined;
    sendMessage: (data: any) => Promise<any>;
    getManifest: () => Promise<any>;
    getURL: (path?: string) => string | Promise<string>;
  };
}

export interface BrowserProxyRequest {
  id: string;
  key: string[];
  args: any[];
}

export interface BrowserProxyResponse {
  id: string;
  result: any;
}
