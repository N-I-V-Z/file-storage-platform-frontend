import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuestOnly } from "../src/features/auth/components/guest-only";
import { PublicHeader } from "../src/features/auth/components/public-header";
import { PublicHeroActions } from "../src/features/auth/components/public-hero-actions";
import { PublicStartLink } from "../src/features/auth/components/public-start-link";
import { useAuth } from "../src/features/auth/hooks/use-auth";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("../src/features/auth/hooks/use-auth", () => ({ useAuth: vi.fn() }));

const base = { login: vi.fn(), logout: vi.fn() };
const account = { id: "user-a", email: "a@example.com", role: "USER" as const };

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("public navigation", () => {
  it("hides guest actions until the session has been checked", () => {
    vi.mocked(useAuth).mockReturnValue({ ...base, user: null, pending: true });
    render(
      <>
        <PublicHeader />
        <PublicHeroActions />
      </>,
    );
    expect(screen.getAllByRole("link", { name: "Hướng dẫn" })).toHaveLength(1);
    expect(
      screen.queryByRole("link", { name: "Đăng nhập" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Tạo tài khoản" }),
    ).not.toBeInTheDocument();
  });

  it("offers guest account actions after the session check", () => {
    vi.mocked(useAuth).mockReturnValue({ ...base, user: null, pending: false });
    render(
      <>
        <PublicHeader />
        <PublicHeroActions />
      </>,
    );
    expect(screen.getAllByRole("link", { name: "Đăng nhập" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Tạo tài khoản/ })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("sends signed-in users to the dashboard instead of the auth form", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...base,
      user: account,
      pending: false,
    });
    render(
      <>
        <PublicHeader />
        <GuestOnly>
          <div>Login form</div>
        </GuestOnly>
      </>,
    );
    expect(screen.getByRole("link", { name: "Vào dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.queryByText("Login form")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the auth form only for guests", () => {
    vi.mocked(useAuth).mockReturnValue({ ...base, user: null, pending: false });
    render(
      <GuestOnly>
        <div>Login form</div>
      </GuestOnly>,
    );
    expect(screen.getByText("Login form")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("points the docs CTA to the correct next step", () => {
    vi.mocked(useAuth).mockReturnValue({ ...base, user: null, pending: false });
    const view = render(<PublicStartLink label="Bắt đầu sử dụng" />);
    expect(
      screen.getByRole("link", { name: /Bắt đầu sử dụng/ }),
    ).toHaveAttribute("href", "/register");
    vi.mocked(useAuth).mockReturnValue({
      ...base,
      user: account,
      pending: false,
    });
    view.rerender(<PublicStartLink label="Bắt đầu sử dụng" />);
    expect(
      screen.getByRole("link", { name: /Bắt đầu sử dụng/ }),
    ).toHaveAttribute("href", "/dashboard");
  });
});
