export interface WindowCreateRequest {
  url: string;
  type: string;
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface WindowUpdateRequest {
  left: number;
  top: number;
}

export interface WindowHandler {
  create: (request: WindowCreateRequest) => void;
  remove: (windowId: string) => void;
  update: (request: WindowUpdateRequest) => void;
}
