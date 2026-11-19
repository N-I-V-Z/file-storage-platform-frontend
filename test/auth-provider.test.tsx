import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../src/features/auth/hooks/use-auth";
import { apiClient } from "../src/lib/http/api-client";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Controls() {
  const { user, login, logout } = useAuth();
  return (
    <>
      <span>{user?.email ?? "signed out"}</span>
      <button
        onClick={() =>
          void login({ email: "a@example.com", password: "password123456" })
        }
      >
        Sign in
      </button>
      <button onClick={() => void logout()}>Sign out</button>
    </>
  );
}

it("clears cached project data when the account changes or signs out", async () => {
  vi.spyOn(apiClient, "refresh").mockResolvedValue(false);
  vi.spyOn(apiClient, "login").mockResolvedValue({
    id: "user-a",
    email: "a@example.com",
  });
  vi.spyOn(apiClient, "logout").mockResolvedValue(undefined);
  const queryClient = new QueryClient();
  queryClient.setQueryData(
    ["projects", "list", "user-old"],
    [{ name: "Private" }],
  );
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Controls />
      </AuthProvider>
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByText("a@example.com");
  expect(
    queryClient.getQueryData(["projects", "list", "user-old"]),
  ).toBeUndefined();

  queryClient.setQueryData(
    ["projects", "list", "user-a"],
    [{ name: "Private" }],
  );
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() =>
    expect(screen.getByText("signed out")).toBeInTheDocument(),
  );
  expect(
    queryClient.getQueryData(["projects", "list", "user-a"]),
  ).toBeUndefined();
});
