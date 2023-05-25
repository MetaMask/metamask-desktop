export type TabsQuery = chrome.tabs.QueryInfo;

export interface TabsHandler {
  query: (request: TabsQuery) => Partial<chrome.tabs.Tab>[];
}
