import assert from "node:assert/strict";
import test from "node:test";
import { readEnvironment } from "../src/lib/env.ts";

test("accepts HTTP URLs for browser, server, and app origins", () => {
  const result = readEnvironment({
    NEXT_PUBLIC_API_BASE_URL: "https://api.example.com/api/v1",
    API_INTERNAL_URL: "http://127.0.0.1:4000/api/v1",
    NEXT_PUBLIC_APP_URL: "https://app.example.com",
  });

  assert.deepEqual(result, {
    publicApiBaseUrl: "https://api.example.com/api/v1",
    internalApiBaseUrl: "http://127.0.0.1:4000/api/v1",
    appUrl: "https://app.example.com",
  });
});

test("rejects missing API URL before a request is sent", () => {
  assert.throws(
    () =>
      readEnvironment({
        API_INTERNAL_URL: "http://127.0.0.1:4000/api/v1",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    /NEXT_PUBLIC_API_BASE_URL/,
  );
});

test("rejects non-HTTP and credential-bearing URLs", () => {
  const valid = {
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000/api/v1",
    API_INTERNAL_URL: "http://127.0.0.1:4000/api/v1",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  };

  assert.throws(
    () => readEnvironment({ ...valid, API_INTERNAL_URL: "file:///tmp/api" }),
    /API_INTERNAL_URL/,
  );
  assert.throws(
    () =>
      readEnvironment({
        ...valid,
        NEXT_PUBLIC_API_BASE_URL: "https://user:pass@api.example.com/api/v1",
      }),
    /NEXT_PUBLIC_API_BASE_URL/,
  );
});
