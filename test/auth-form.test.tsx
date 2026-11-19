import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "../src/features/auth/components/auth-form";
import { ApiError } from "../src/lib/http/api-client";

const login = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("../src/features/auth/hooks/use-auth", () => ({
  useAuth: () => ({ login }),
}));

describe("AuthForm", () => {
  beforeEach(() => {
    login.mockReset();
    replace.mockReset();
  });
  afterEach(cleanup);

  it("shows validation errors and does not submit short passwords", async () => {
    render(<AuthForm mode="register" />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "bad" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
    expect(
      await screen.findByText("Nhập địa chỉ email hợp lệ."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mật khẩu cần ít nhất 12 ký tự."),
    ).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("keeps entered email and shows a recoverable server error", async () => {
    login.mockRejectedValue(
      new ApiError(
        401,
        "Email hoặc mật khẩu không đúng, hoặc phiên đã hết hạn.",
      ),
    );
    render(<AuthForm mode="login" />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email hoặc mật khẩu không đúng",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("a@example.com");
    expect(replace).not.toHaveBeenCalled();
  });

  it("navigates after successful login", async () => {
    login.mockResolvedValue(undefined);
    render(<AuthForm mode="login" />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "validpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});
