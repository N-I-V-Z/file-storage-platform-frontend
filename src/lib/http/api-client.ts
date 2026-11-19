import type {
  LoginResponse,
  RefreshResponse,
  User,
  Credentials,
} from "../../features/auth/types/auth.types";

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

  private async parse<T>(response: Response): Promise<T> {
    if (!response.ok)
      throw new ApiError(response.status, errorMessage(response.status));
    return response.json() as Promise<T>;
  }

  async register(credentials: Credentials): Promise<User> {
    return this.parse<User>(
      await this.send("/auth/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    );
  }

  async login(credentials: Credentials): Promise<User> {
    const result = await this.parse<LoginResponse>(
      await this.send("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
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
        const result = (await response.json()) as RefreshResponse;
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

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.accessToken;
    let response = await this.send(path, init, token);
    if (response.status === 401 && token && (await this.refresh())) {
      response = await this.send(path, init, this.accessToken);
    }
    return this.parse<T>(response);
  }

  async me(): Promise<User> {
    return this.request<User>("/auth/me");
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
