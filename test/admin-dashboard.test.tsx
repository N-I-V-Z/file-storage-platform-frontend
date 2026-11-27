import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AdminDashboard } from "../src/features/admin/components/admin-dashboard";
import { useAuth } from "../src/features/auth/hooks/use-auth";
import {
  getAdminOverview,
  listAdminAuditEvents,
  listAdminProjects,
} from "../src/features/admin/api/admin.api";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("../src/features/auth/hooks/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("../src/features/admin/api/admin.api", () => ({
  getAdminOverview: vi.fn(),
  listAdminProjects: vi.fn(),
  listAdminAuditEvents: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function showDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AdminDashboard />
    </QueryClientProvider>,
  );
}

it("hides reports from a non-admin user without fetching them", () => {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "user", email: "user@example.com", role: "USER" },
    pending: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
  showDashboard();
  expect(
    screen.getByRole("heading", { name: "Không có quyền truy cập" }),
  ).toBeInTheDocument();
  expect(getAdminOverview).not.toHaveBeenCalled();
  expect(listAdminProjects).not.toHaveBeenCalled();
  expect(listAdminAuditEvents).not.toHaveBeenCalled();
});

it("shows only read-only report data and pages projects independently", async () => {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "admin", email: "admin@example.com", role: "ADMIN" },
    pending: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
  vi.mocked(getAdminOverview).mockResolvedValue({
    userCount: 2,
    projectCount: 21,
    fileCount: 3,
    quotaBytes: "4096",
    usedBytes: "2048",
    reservedBytes: "0",
  });
  vi.mocked(listAdminProjects).mockImplementation(async (page) => ({
    items: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        ownerId: "22222222-2222-4222-8222-222222222222",
        name: page === 1 ? "Project Alpha" : "Project Beta",
        quotaBytes: "4096",
        usedBytes: "2048",
        reservedBytes: "0",
        createdAt: "2026-11-26T00:00:00.000Z",
      },
    ],
    total: 21,
    page,
    pageSize: 20,
  }));
  vi.mocked(listAdminAuditEvents).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  showDashboard();
  expect(await screen.findByText("Project Alpha")).toBeInTheDocument();
  expect(screen.getAllByText("2 KiB")).toHaveLength(2);
  expect(
    screen.queryByRole("button", { name: /xóa|sửa|cấp quyền/i }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Sau" })[0]);
  expect(await screen.findByText("Project Beta")).toBeInTheDocument();
  expect(listAdminProjects).toHaveBeenCalledWith(2);
  expect(listAdminAuditEvents).toHaveBeenCalledWith(1);
});

it("offers retry when a report fails", async () => {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "admin", email: "admin@example.com", role: "ADMIN" },
    pending: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
  vi.mocked(getAdminOverview).mockRejectedValue(new Error("private details"));
  vi.mocked(listAdminProjects).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  vi.mocked(listAdminAuditEvents).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  showDashboard();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Không thể tải báo cáo",
    ),
  );
  expect(screen.queryByText("private details")).not.toBeInTheDocument();
  vi.mocked(getAdminOverview).mockResolvedValue({
    userCount: 1,
    projectCount: 0,
    fileCount: 0,
    quotaBytes: "0",
    usedBytes: "0",
    reservedBytes: "0",
  });
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByText("Hạn mức cộng dồn")).toBeInTheDocument();
});
