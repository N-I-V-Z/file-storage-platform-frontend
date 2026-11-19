export type User = { id: string; email: string };

export type LoginResponse = { accessToken: string; user: User };

export type RefreshResponse = { accessToken: string };

export type Credentials = { email: string; password: string };
