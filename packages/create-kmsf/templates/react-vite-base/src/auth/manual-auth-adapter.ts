import type { AuthUser } from "./auth-types";

export interface ManualAuthAdapter {
  getCurrentUser: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
}

export const manualAuthAdapter: ManualAuthAdapter = {
  async getCurrentUser() {
    return null;
  },
  async signOut() {
    return;
  },
};
