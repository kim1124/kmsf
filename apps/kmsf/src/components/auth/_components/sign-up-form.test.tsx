import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/[locale]/(public)/sign-in/actions", () => ({
  signUpAction: vi.fn(),
}));

import { SignUpForm } from "./sign-up-form";

const signUpProps = {
  csrfToken: "csrf",
  labels: {
    email: "E-mail",
    password: "비밀번호",
    passwordConfirm: "비밀번호 확인",
    submit: "회원 가입",
    username: "ID",
  },
  locale: "ko",
  messages: {
    authFailed: "회원 가입에 실패했습니다.",
    securityFailed: "보안 검증에 실패했습니다.",
    fieldErrors: {
      email: {
        duplicate: "이미 사용 중인 E-mail입니다.",
        invalid: "올바른 E-mail 주소를 입력해 주세요.",
      },
      password: {
        invalid: "비밀번호는 6자~32자의 영문, 숫자, 특수문자를 모두 포함해야 합니다.",
      },
      passwordConfirm: {
        invalid: "비밀번호 확인은 6자 이상 입력해 주세요.",
        mismatch: "비밀번호가 일치하지 않습니다.",
      },
      username: {
        duplicate: "이미 사용 중인 ID입니다.",
        invalid: "ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다.",
      },
    },
  },
  tooltips: {
    email: "E-mail 도움말",
    password: "비밀번호 도움말",
    passwordConfirm: "비밀번호 확인 도움말",
    username: "ID 도움말",
  },
};

describe("SignUpForm", () => {
  it("shows client validation only after blur", () => {
    render(<SignUpForm {...signUpProps} />);

    fireEvent.change(screen.getByLabelText("ID"), { target: { value: "kim" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "kim" } });

    expect(
      screen.queryByText("ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다."),
    ).toBeNull();
    expect(screen.queryByText("올바른 E-mail 주소를 입력해 주세요.")).toBeNull();

    fireEvent.blur(screen.getByLabelText("E-mail"));

    expect(screen.getByText("올바른 E-mail 주소를 입력해 주세요.")).toBeTruthy();
    expect(
      screen.queryByText("ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다."),
    ).toBeNull();
  });

  it("marks every invalid field after submit", () => {
    render(<SignUpForm {...signUpProps} />);

    fireEvent.click(screen.getByRole("button", { name: "회원 가입" }));

    expect(
      screen.getByText("ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다."),
    ).toBeTruthy();
    expect(screen.getByText("올바른 E-mail 주소를 입력해 주세요.")).toBeTruthy();
    expect(
      screen.getByText("비밀번호는 6자~32자의 영문, 숫자, 특수문자를 모두 포함해야 합니다."),
    ).toBeTruthy();
  });
});
