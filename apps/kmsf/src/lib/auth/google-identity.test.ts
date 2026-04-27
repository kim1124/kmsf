import { describe, expect, it } from "vitest";

import { summarizeGoogleIdentityState } from "./google-identity";

describe("summarizeGoogleIdentityState", () => {
  it("marks Google as disconnected when no google identity exists", () => {
    expect(
      summarizeGoogleIdentityState([
        { identity_id: "email_identity", provider: "email" },
      ]),
    ).toEqual({
      isLinked: false,
      canUnlink: false,
      identity: null,
    });
  });

  it("marks Google as linked and unlinkable when another identity exists", () => {
    const googleIdentity = { identity_id: "google_identity", provider: "google" };

    expect(
      summarizeGoogleIdentityState([
        { identity_id: "email_identity", provider: "email" },
        googleIdentity,
      ]),
    ).toEqual({
      isLinked: true,
      canUnlink: true,
      identity: googleIdentity,
    });
  });

  it("does not allow unlinking the only Google identity", () => {
    const googleIdentity = { identity_id: "google_identity", provider: "google" };

    expect(summarizeGoogleIdentityState([googleIdentity])).toEqual({
      isLinked: true,
      canUnlink: false,
      identity: googleIdentity,
    });
  });
});
