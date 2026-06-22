import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/[locale]/(public)/sign-in/actions", () => ({
  signInAction: vi.fn(),
}));

import { SignInForm } from "./sign-in-form";

const signInProps = {
  csrfToken: "csrf",
  labels: {
    password: "비밀번호",
    submit: "로그인",
    username: "ID",
  },
  locale: "ko",
  messages: {
    authFailed: "ID 또는 비밀번호가 올바르지 않습니다.",
    locked: "{seconds}초 후 다시 시도해 주세요.",
    lockedTitle: "로그인 제한",
    securityFailed: "보안 검증에 실패했습니다.",
    fieldErrors: {
      password: {
        invalid: "비밀번호는 6자~32자의 영문, 숫자, 특수문자를 모두 포함해야 합니다.",
      },
      username: {
        invalid: "ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다.",
      },
    },
  },
  tooltips: {
    password: "비밀번호 도움말",
    username: "ID 도움말",
  },
};

describe("SignInForm", () => {
  it("does not show client validation while typing before blur", () => {
    render(<SignInForm {...signInProps} />);

    fireEvent.change(screen.getByLabelText("ID"), { target: { value: "kim" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "1234" } });

    expect(
      screen.queryByText("ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다."),
    ).toBeNull();
    expect(
      screen.queryByText("비밀번호는 6자~32자의 영문, 숫자, 특수문자를 모두 포함해야 합니다."),
    ).toBeNull();
  });

  it("shows client validation after blur and marks all fields on submit", () => {
    render(<SignInForm {...signInProps} />);

    fireEvent.change(screen.getByLabelText("ID"), { target: { value: "kim" } });
    fireEvent.blur(screen.getByLabelText("ID"));

    expect(
      screen.getByText("ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다."),
    ).toBeTruthy();
    expect(
      screen.queryByText("비밀번호는 6자~32자의 영문, 숫자, 특수문자를 모두 포함해야 합니다."),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      screen.getByText("비밀번호는 6자~32자의 영문, 숫자, 특수문자를 모두 포함해야 합니다."),
    ).toBeTruthy();
  });
});
