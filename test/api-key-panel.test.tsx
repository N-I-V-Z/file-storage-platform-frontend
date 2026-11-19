import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeyPanel } from "../src/features/api-keys/components/api-key-panel";
import {
  issueApiKey,
  listApiKeys,
  revokeApiKey,
} from "../src/features/api-keys/api/api-keys.api";
import { apiKeyKeys } from "../src/features/api-keys/api/api-keys.keys";
import type { ApiKey } from "../src/features/api-keys/schemas/api-keys.schemas";

vi.mock("../src/features/api-keys/api/api-keys.api", () => ({
  issueApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
}));

const projectId = "00000000-0000-4000-8000-000000000001";
const keyId = "00000000-0000-4000-8000-000000000002";
const token = `fsp_${keyId}_${"A".repeat(43)}`;
const key: ApiKey = {
  id: keyId,
  projectId,
  name: "Reader",
  scopes: ["files:read"],
  expiresAt: null,
  revokedAt: null,
  lastUsedAt: null,
  createdAt: "2026-11-19T00:00:00.000Z",
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ApiKeyPanel projectId={projectId} />
    </QueryClientProvider>,
  );
  return client;
}

describe("ApiKeyPanel", () => {
  beforeEach(() => {
    vi.mocked(listApiKeys).mockReset();
    vi.mocked(issueApiKey).mockReset();
    vi.mocked(revokeApiKey).mockReset();
  });
  afterEach(cleanup);

  it("shows a new secret once and keeps it out of the list cache", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.mocked(listApiKeys).mockResolvedValue([]);
    vi.mocked(issueApiKey).mockResolvedValue({ ...key, token });
    const client = setup();
    await screen.findByText("Chưa có API key nào");
    fireEvent.click(screen.getByRole("button", { name: "Tạo API key" }));
    fireEvent.change(screen.getByLabelText("Tên API key"), {
      target: { value: "Reader" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cấp key" }));
    expect(await screen.findByText(token)).toBeInTheDocument();
    expect(
      JSON.stringify(client.getQueryData(apiKeyKeys.list(projectId))),
    ).not.toContain(token);
    fireEvent.click(screen.getByRole("button", { name: "Sao chép key" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(token));
    expect(await screen.findByText("Đã sao chép API key.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đã lưu key" }));
    expect(screen.queryByText(token)).not.toBeInTheDocument();
  });

  it("requires at least one scope before issuing a key", async () => {
    vi.mocked(listApiKeys).mockResolvedValue([]);
    setup();
    await screen.findByText("Chưa có API key nào");
    fireEvent.click(screen.getByRole("button", { name: "Tạo API key" }));
    fireEvent.change(screen.getByLabelText("Tên API key"), {
      target: { value: "Reader" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Đọc tệp/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cấp key" }));
    expect(
      await screen.findByText("Chọn ít nhất một quyền."),
    ).toBeInTheDocument();
    expect(issueApiKey).not.toHaveBeenCalled();
  });

  it("keeps the create form open when issuance fails", async () => {
    vi.mocked(listApiKeys).mockResolvedValue([]);
    vi.mocked(issueApiKey).mockRejectedValue(new Error("offline"));
    setup();
    await screen.findByText("Chưa có API key nào");
    fireEvent.click(screen.getByRole("button", { name: "Tạo API key" }));
    fireEvent.change(screen.getByLabelText("Tên API key"), {
      target: { value: "Reader" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cấp key" }));
    expect(
      await screen.findByText("Không thể cấp API key. Vui lòng thử lại."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tên API key")).toHaveValue("Reader");
    expect(
      screen.queryByRole("region", { name: "API key vừa tạo" }),
    ).toBeNull();
  });

  it("requires confirmation before revoking a key", async () => {
    vi.mocked(listApiKeys).mockResolvedValue([key]);
    vi.mocked(revokeApiKey).mockResolvedValue(undefined);
    setup();
    await screen.findByText("Reader");
    fireEvent.click(screen.getByRole("button", { name: "Thu hồi Reader" }));
    expect(screen.getByText(/Thu hồi key Reader/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hủy thu hồi" }));
    expect(revokeApiKey).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Thu hồi Reader" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận thu hồi" }));
    await waitFor(() =>
      expect(revokeApiKey).toHaveBeenCalledWith(projectId, keyId),
    );
    expect(await screen.findByText("Đã thu hồi Reader.")).toBeInTheDocument();
  });

  it("keeps revoke confirmation open after a failed request", async () => {
    vi.mocked(listApiKeys).mockResolvedValue([key]);
    vi.mocked(revokeApiKey).mockRejectedValue(new Error("offline"));
    setup();
    await screen.findByText("Reader");
    fireEvent.click(screen.getByRole("button", { name: "Thu hồi Reader" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận thu hồi" }));
    expect(
      await screen.findByText("Không thể thu hồi API key. Vui lòng thử lại."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Xác nhận thu hồi" }),
    ).toBeEnabled();
    expect(screen.getByText("Đang hoạt động")).toBeInTheDocument();
  });
});
