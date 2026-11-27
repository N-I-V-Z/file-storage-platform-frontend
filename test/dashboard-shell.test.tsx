import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardHome } from "../src/features/auth/components/dashboard-home";
import DashboardLoading from "../app/dashboard/loading";
import DashboardError from "../app/dashboard/error";
import { useAuth } from "../src/features/auth/hooks/use-auth";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("../src/features/auth/hooks/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("../src/features/projects/components/project-workspace", () => ({
  ProjectWorkspace: () => <section id="projects">Project workspace</section>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("dashboard shell", () => {
  it("keeps private content hidden while restoring the session", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      pending: true,
      logout: vi.fn(),
      login: vi.fn(),
    });
    render(<DashboardHome />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang kiểm tra phiên");
    expect(screen.queryByText("Project workspace")).not.toBeInTheDocument();
  });

  it("redirects an unauthenticated visitor without showing private content", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      pending: false,
      logout: vi.fn(),
      login: vi.fn(),
    });
    render(<DashboardHome />);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("Project workspace")).not.toBeInTheDocument();
  });

  it("provides project and account navigation for a signed-in user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-a", email: "a@example.com", role: "USER" },
      pending: false,
      logout: vi.fn(),
      login: vi.fn(),
    });
    render(<DashboardHome />);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "#projects",
    );
    expect(screen.getByRole("link", { name: "Tài khoản" })).toHaveAttribute(
      "href",
      "#account",
    );
    expect(
      screen.getByRole("heading", { name: "Tài khoản" }),
    ).toBeInTheDocument();
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Quản trị" }),
    ).not.toBeInTheDocument();
  });

  it("links administrators to read-only reports", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "admin-a", email: "admin@example.com", role: "ADMIN" },
      pending: false,
      logout: vi.fn(),
      login: vi.fn(),
    });
    render(<DashboardHome />);
    expect(screen.getByRole("link", { name: "Quản trị" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("shows route loading and a recoverable error without raw details", () => {
    const reset = vi.fn();
    render(<DashboardLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang mở workspace");
    cleanup();
    render(
      <DashboardError error={new Error("secret stack trace")} reset={reset} />,
    );
    expect(screen.queryByText("secret stack trace")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
