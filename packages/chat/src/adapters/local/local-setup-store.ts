import { createChatError, getErrorMessage } from "../../core/errors";
import type { ChatSetupState, StorageLike } from "../../core/types";

const SETUP_KEY = "kmsf.chat.setup";

type LocalSetupStoreOptions = {
  key?: string;
  storage: StorageLike;
};

export function createLocalSetupStore(options: LocalSetupStoreOptions) {
  const key = options.key ?? SETUP_KEY;

  return {
    load() {
      const raw = options.storage.getItem(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as ChatSetupState;
    },
    remove() {
      options.storage.removeItem(key);
    },
    save(state: ChatSetupState) {
      options.storage.setItem(key, JSON.stringify(state));
    },
    tryLoad() {
      try {
        return { item: this.load() };
      } catch (error) {
        return {
          error: createChatError("local_storage_parse_error", getErrorMessage(error), error),
          item: null,
        };
      }
    },
  };
}
