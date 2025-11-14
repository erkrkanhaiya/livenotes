// Global type declarations for Chrome Extension APIs
declare global {
  interface Window {
    chrome?: typeof chrome;
  }

  namespace chrome {
    namespace storage {
      interface StorageArea {
        get(keys: string[] | string, callback: (result: any) => void): void;
        set(items: Record<string, any>, callback?: () => void): void;
      }
      const local: StorageArea;
    }

    namespace runtime {
      function sendMessage(message: any, callback?: (response: any) => void): void;
      const lastError: { message: string } | undefined;
      const onMessage: {
        addListener(callback: (request: any, sender: any, sendResponse: (response: any) => void) => void): void;
      };
      const onInstalled: {
        addListener(callback: () => void): void;
      };
    }

    namespace identity {
      function getAuthToken(
        details: { interactive: boolean },
        callback: (token?: string) => void
      ): void;
      function removeCachedAuthToken(
        details: { token: string },
        callback: () => void
      ): void;
    }
  }

  const chrome: {
    storage: typeof chrome.storage;
    runtime: typeof chrome.runtime;
    identity: typeof chrome.identity;
  } | undefined;
}

export {};