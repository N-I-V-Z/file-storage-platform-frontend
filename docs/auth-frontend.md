# Frontend authentication

The browser calls `NEXT_PUBLIC_API_BASE_URL` directly with `credentials: "include"`. Set backend `CORS_ORIGINS` to the exact frontend origin, including its port in local development. The backend refresh cookie is `HttpOnly`, `SameSite=Lax`, and scoped to `/api/v1/auth`. Deploy the app and API on the same site so the browser can send that cookie; unrelated top-level domains require a different cookie and CSRF design.

The access JWT lives only in the `ApiClient` instance in memory. On page load, `AuthProvider` refreshes the cookie session, then fetches `/auth/me`. Parallel 401 responses share one refresh request and retry once. Refresh failure clears the local session. Login and registration forms validate input with Zod and React Hook Form. The dashboard renders no account information until the session check completes; the backend remains responsible for authorizing every private endpoint.

To test locally, copy `.env.example` to `.env`, run the backend at `localhost:4000` and frontend with `pnpm dev`, then register, sign in, reload `/dashboard`, and sign out. `pnpm test` covers API client rotation and form states; `pnpm typecheck`, `pnpm lint`, and `pnpm build` are CI gates. No token or password belongs in localStorage or logs.

## Response contract migration

The API client accepts both current raw JSON success bodies and the versioned success envelope `{ "success": true, "data": ..., "timestamp": "..." }`. It validates the envelope and then validates `data` with the endpoint's Zod schema. HTTP errors continue to use the backend error envelope; the UI maps status codes to safe Vietnamese messages. `204` responses are empty. Raw-body compatibility is temporary until the backend envelope branch has merged and been verified; remove it on a separate frontend branch afterward.
