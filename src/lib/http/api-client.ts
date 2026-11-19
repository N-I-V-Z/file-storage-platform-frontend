import type { User, Credentials } from "../../features/auth/types/auth.types";
import {
  loginResponseSchema,
  refreshResponseSchema,
  userSchema,
} from "../../features/auth/schemas/auth.schemas";
import { z } from "zod";

const successEnvelopeSchema = z.strictObject({
  success: z.literal(true),
  data: z.unknown(),
  timestamp: z.iso.datetime(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function errorMessage(status: number): string {
  if (status === 401)
    return "Email hoặc mật khẩu không đúng, hoặc phiên đã hết hạn.";
  if (status === 409) return "Email này đã được sử dụng.";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 404)
    return "Không tìm thấy tài nguyên hoặc bạn không có quyền truy cập.";
  if (status === 429)
    return "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.";
  if (status >= 500) return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  return "Yêu cầu không thành công. Vui lòng kiểm tra thông tin và thử lại.";
}

export class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;
  private generation = 0;
  private sessionLostListeners = new Set<() => void>();

  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  clearSession(): void {
    this.generation += 1;
    this.accessToken = null;
    this.sessionLostListeners.forEach((listener) => listener());
  }

  onSessionLost(listener: () => void): () => void {
    this.sessionLostListeners.add(listener);
    return () => this.sessionLostListeners.delete(listener);
  }

  private async send(
    path: string,
    init: RequestInit = {},
    token?: string | null,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.body) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  }

  private async parse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
    if (!response.ok)
      throw new ApiError(response.status, errorMessage(response.status));
    const body: unknown = await response.json();
    const isEnvelope =
      typeof body === "object" && body !== null && "success" in body;
    const envelope = isEnvelope ? successEnvelopeSchema.safeParse(body) : null;
    if (envelope && !envelope.success)
      throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
    const result = schema.safeParse(envelope ? envelope.data.data : body);
    if (!result.success)
      throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
    return result.data;
  }

  async register(credentials: Credentials): Promise<User> {
    return this.parse(
      await this.send("/auth/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
      userSchema,
    );
  }

  async login(credentials: Credentials): Promise<User> {
    const result = await this.parse(
      await this.send("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
      loginResponseSchema,
    );
    this.setAccessToken(result.accessToken);
    return result.user;
  }

  async refresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    const currentGeneration = this.generation;
    this.refreshPromise = (async () => {
      try {
        const response = await this.send("/auth/refresh", { method: "POST" });
        if (!response.ok) {
          if (currentGeneration === this.generation) this.clearSession();
          return false;
        }
        const result = await this.parse(response, refreshResponseSchema);
        if (currentGeneration !== this.generation) return false;
        this.setAccessToken(result.accessToken);
        return true;
      } catch {
        if (currentGeneration === this.generation) this.clearSession();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  private async sendAuthenticated(
    path: string,
    init: RequestInit,
  ): Promise<Response> {
    const token = this.accessToken;
    let response = await this.send(path, init, token);
    if (response.status === 401 && token && (await this.refresh())) {
      response = await this.send(path, init, this.accessToken);
    }
    return response;
  }

  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await this.sendAuthenticated(path, init);
    return this.parse(response, schema);
  }

  async requestNoContent(path: string, init: RequestInit): Promise<void> {
    const response = await this.sendAuthenticated(path, init);
    if (!response.ok)
      throw new ApiError(response.status, errorMessage(response.status));
  }

  async me(): Promise<User> {
    return this.request("/auth/me", userSchema);
  }

  async logout(): Promise<void> {
    let response = await this.send(
      "/auth/logout",
      { method: "POST" },
      this.accessToken,
    );
    if (response.status === 401 && (await this.refresh())) {
      response = await this.send(
        "/auth/logout",
        { method: "POST" },
        this.accessToken,
      );
    }
    if (!response.ok)
      throw new ApiError(response.status, errorMessage(response.status));
    this.clearSession();
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
);
