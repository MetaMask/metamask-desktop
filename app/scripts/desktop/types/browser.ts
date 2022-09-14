export interface Browser {
  storage: {
    local: {
      get: () => Promise<any>;
      set: (data: any) => Promise<void>;
    };
  };
  runtime: {
    reload: () => undefined;
  };
}
