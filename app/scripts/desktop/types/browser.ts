export interface Browser {
  storage: {
    local: {
      get: () => Promise<any>;
      set: (data: any) => Promise<void>;
    };
  };
  runtime: {
    id: string;
    reload: () => undefined;
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
